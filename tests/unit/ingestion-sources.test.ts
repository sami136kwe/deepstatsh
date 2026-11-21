import { describe, expect, it, vi } from "vitest";
import { isPublicDomain, mergeCandidates, passesPopularityFilter, popularityScore, selectBooks } from "@/lib/ingestion/discover";
import { backoffDelay, BudgetExceededError, CallBudget, HttpError, isRetryableStatus, withRetry } from "@/lib/ingestion/http";
import { parseGoogleVolume, stripHtml } from "@/lib/ingestion/sources/googleBooks";
import { parseOpenLibraryDoc } from "@/lib/ingestion/sources/openLibrary";
import type { BookCandidate } from "@/lib/ingestion/sources/types";
import { parseLifespan } from "@/lib/ingestion/sources/wikipedia";

const base: BookCandidate = {
  source: "google",
  googleBooksId: null,
  openLibraryId: null,
  title: "Atomic Habits",
  author: "James Clear",
  language: "en",
  publishedYear: 2018,
  coverUrl: null,
  description: null,
  averageRating: 4.4,
  ratingsCount: 3000,
  infoLink: null,
};

describe("discovery", () => {
  it("scores popular, well-rated books higher", () => {
    expect(popularityScore(4.5, 10000)).toBeGreaterThan(popularityScore(4.5, 50));
    expect(popularityScore(4.6, 500)).toBeGreaterThan(popularityScore(3.2, 500));
    expect(popularityScore(null, 0)).toBe(0);
    expect(popularityScore(5, 1_000_000)).toBeLessThanOrEqual(100);
  });

  it("merges the same book from both catalogues and keeps the richest data", () => {
    const merged = mergeCandidates([
      { ...base, googleBooksId: "g1", description: "short", ratingsCount: 12, averageRating: 4.0 },
      { ...base, source: "openlibrary", openLibraryId: "OL1W", title: "Atomic habits: tiny changes", coverUrl: "https://covers/x.jpg", publishedYear: 2017, ratingsCount: 900, averageRating: 4.3 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ googleBooksId: "g1", openLibraryId: "OL1W", coverUrl: "https://covers/x.jpg", publishedYear: 2017, ratingsCount: 900 });
  });

  it("filters out unrated or poorly rated books and already known ones", () => {
    expect(passesPopularityFilter({ averageRating: 4.5, ratingsCount: 3 })).toBe(false);
    expect(passesPopularityFilter({ averageRating: 3.1, ratingsCount: 500 })).toBe(false);
    const picked = selectBooks(
      [base, { ...base, title: "Deep Work", author: "Cal Newport" }, { ...base, title: "Meh", author: "X", averageRating: 2.9 }],
      new Set(["atomic habits|clear"]),
      10,
    );
    expect(picked.map((b) => b.title)).toEqual(["Deep Work"]);
  });

  it("marks public domain works conservatively", () => {
    expect(isPublicDomain(180, 180, 2026)).toBe(true); // Marcus Aurelius
    expect(isPublicDomain(1532, 1527, 2026)).toBe(true); // Machiavelli
    expect(isPublicDomain(1936, 1955, 2026)).toBe(false); // Carnegie: too recent
    expect(isPublicDomain(1925, 1980, 2026)).toBe(false); // old book, author died recently
    expect(isPublicDomain(1890, null, 2026)).toBe(true);
    expect(isPublicDomain(1920, null, 2026)).toBe(false);
    expect(isPublicDomain(null, 100, 2026)).toBe(false);
  });
});

describe("source parsers", () => {
  it("parses a Google Books volume", () => {
    const book = parseGoogleVolume({
      id: "abc",
      volumeInfo: {
        title: "Deep Work",
        authors: ["Cal Newport"],
        publishedDate: "2016-01-05",
        description: "<p>Rules for <b>focused</b> success</p>",
        averageRating: 4,
        ratingsCount: 120,
        imageLinks: { thumbnail: "http://books.google.com/x" },
        infoLink: "http://books.google.com/books?id=abc",
      },
    });
    expect(book).toMatchObject({ googleBooksId: "abc", publishedYear: 2016, description: "Rules for focused success", coverUrl: "https://books.google.com/x" });
    expect(parseGoogleVolume({ id: "x", volumeInfo: { title: "No author" } })).toBeNull();
    expect(stripHtml("a<br>b &amp; c")).toBe("a\nb & c");
  });

  it("parses an Open Library search document", () => {
    const book = parseOpenLibraryDoc({ key: "/works/OL1W", title: "Meditations", author_name: ["Marcus Aurelius"], first_publish_year: 180, ratings_average: 4.3, ratings_count: 400, cover_i: 9, language: ["eng"] });
    expect(book).toMatchObject({ openLibraryId: "OL1W", language: "en", coverUrl: "https://covers.openlibrary.org/b/id/9-L.jpg", infoLink: "https://openlibrary.org/works/OL1W" });
  });

  it("extracts lifespans from Wikipedia descriptions", () => {
    expect(parseLifespan("Roman emperor (121–180)")).toEqual({ birth: 121, death: 180 });
    expect(parseLifespan("Chinese general (c. 544–496 BC)")).toEqual({ birth: -544, death: -496 });
    expect(parseLifespan("American psychologist")).toBeNull();
  });
});

describe("robustness helpers", () => {
  it("computes capped exponential backoff with jitter", () => {
    expect(backoffDelay(0, 500, 30_000, () => 1)).toBe(500);
    expect(backoffDelay(3, 500, 30_000, () => 1)).toBe(4000);
    expect(backoffDelay(20, 500, 30_000, () => 1)).toBe(30_000);
    expect(backoffDelay(5, 500, 30_000, () => 0)).toBe(0);
  });

  it("retries transient errors only", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const promise = withRetry(async () => {
      calls += 1;
      if (calls < 3) throw new HttpError(503, "u", "unavailable");
      return "ok";
    }, { baseMs: 1 });
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(calls).toBe(3);
    vi.useRealTimers();

    let notFound = 0;
    await expect(withRetry(async () => { notFound += 1; throw new HttpError(404, "u", "nope"); })).rejects.toThrow("nope");
    expect(notFound).toBe(1);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(400)).toBe(false);
  });

  it("enforces the model call budget", () => {
    const budget = new CallBudget(2);
    budget.take();
    budget.take();
    expect(() => budget.take()).toThrow(BudgetExceededError);
    expect(budget.count).toBe(2);
    expect(budget.remaining).toBe(0);
  });
});
