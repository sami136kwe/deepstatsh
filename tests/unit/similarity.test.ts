import { describe, expect, it } from "vitest";
import {
  copiesSource,
  cosineSimilarity,
  DUPLICATE_SIMILARITY,
  findDuplicate,
  longestCommonWordRun,
  MAX_COPIED_RUN,
} from "@/lib/ingestion/similarity";
import { bookDedupKey, contentHash, splitSentences } from "@/lib/ingestion/text";

const SOURCE =
  "In this groundbreaking book the author shows that small habits compound over time into remarkable results for anyone willing to start today.";

describe("source similarity", () => {
  it("measures the longest run of identical consecutive words, ignoring case and accents", () => {
    expect(longestCommonWordRun("Élan vital du matin", "elan VITAL du soir")).toBe(3);
    expect(longestCommonWordRun("", "anything")).toBe(0);
  });

  it(`rejects a card that copies ${MAX_COPIED_RUN} consecutive words of the description`, () => {
    const copied = `Look: ${SOURCE.split(" ").slice(2, 2 + MAX_COPIED_RUN).join(" ")}. Then act.`;
    expect(copiesSource(copied, SOURCE)).toBe(true);
  });

  it("accepts a reworded card", () => {
    const reworded = "Tiny routines pile up. Two minutes a day looks like nothing, until a year later it is everything.";
    expect(copiesSource(reworded, SOURCE)).toBe(false);
    expect(copiesSource(reworded, null)).toBe(false);
  });

  it("allows a run just under the limit", () => {
    const words = SOURCE.split(" ").slice(0, MAX_COPIED_RUN - 1).join(" ");
    expect(longestCommonWordRun(words, SOURCE)).toBe(MAX_COPIED_RUN - 1);
    expect(copiesSource(words, SOURCE)).toBe(false);
  });
});

describe("semantic deduplication", () => {
  it("computes cosine similarity", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1);
    expect(() => cosineSimilarity([1], [1, 2])).toThrow();
  });

  it(`flags a vector as duplicate only above ${DUPLICATE_SIMILARITY}`, () => {
    const pool = [
      [1, 0, 0],
      [0.7, 0.7, 0],
    ];
    expect(findDuplicate([0.99, 0.05, 0], pool)).toBe(0);
    expect(findDuplicate([0, 0, 1], pool)).toBe(-1);
    // cos = 0.9 is below the threshold
    expect(findDuplicate([0.9, Math.sqrt(1 - 0.81), 0], [[1, 0, 0]])).toBe(-1);
  });
});

describe("exact deduplication helpers", () => {
  it("hashes cards independently of case, accents and punctuation", () => {
    expect(contentHash("fr", "Le Coût", "Tu sais ?")).toBe(contentHash("fr", "le cout", "tu sais"));
    expect(contentHash("fr", "a", "b")).not.toBe(contentHash("en", "a", "b"));
  });

  it("recognises the same book across catalogues", () => {
    expect(bookDedupKey("Atomic Habits: An Easy & Proven Way", "James Clear")).toBe(
      bookDedupKey("Atomic habits", "Clear, James".split(", ").reverse().join(" ")),
    );
  });

  it("splits sentences on . ! ? and keeps dialogue inside its sentence", () => {
    expect(splitSentences("Tu sais quoi ? Rien. Vraiment rien !")).toEqual(["Tu sais quoi ?", "Rien.", "Vraiment rien !"]);
    expect(splitSentences("Il a dit « non. » Puis il est parti.")).toHaveLength(2);
  });
});
