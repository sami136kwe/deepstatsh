import { describe, expect, it } from "vitest";
import { coverColors, hashString, ideaStates, nextIdeaPosition, percent, pickLanguageRows } from "@/lib/books-logic";

const row = (id: string, language: string, idea_count: number) => ({ id, language, idea_count });

describe("language of a book", () => {
  it("shows the preferred language when the book has ideas in it", () => {
    const rows = pickLanguageRows([row("a", "fr", 8), row("a", "en", 8)], "fr");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ language: "fr", fallback: false });
  });

  it("falls back to English when the book has no ideas in the preferred language", () => {
    const rows = pickLanguageRows([row("a", "fr", 0), row("a", "en", 8)], "fr");
    expect(rows[0]).toMatchObject({ language: "en", fallback: true });
  });

  it("drops books that cannot be read in any language and keeps the order of the books", () => {
    const rows = pickLanguageRows([row("b", "fr", 0), row("b", "en", 0), row("a", "fr", 3), row("a", "en", 0), row("c", "en", 2)], "en");
    expect(rows.map((r) => r.id)).toEqual(["a", "c"]);
    expect(rows[0]).toMatchObject({ language: "fr", fallback: true }); // only French is readable
  });
});

describe("unlocking ideas in order", () => {
  it("opens only the first idea at the start", () => {
    const states = ideaStates([1, 2, 3, 4], new Set());
    expect([...states.values()]).toEqual(["unlocked", "locked", "locked", "locked"]);
  });

  it("unlocks the next idea once the previous ones are done", () => {
    const states = ideaStates([1, 2, 3, 4], new Set([1, 2]));
    expect([...states.values()]).toEqual(["completed", "completed", "unlocked", "locked"]);
  });

  it("keeps later ideas locked when an earlier one is missing (no skipping)", () => {
    const states = ideaStates([1, 2, 3], new Set([1, 3]));
    expect(states.get(2)).toBe("unlocked");
    expect(states.get(3)).toBe("completed");
  });

  it("finds the next idea to read, or none when the book is finished", () => {
    expect(nextIdeaPosition([3, 1, 2], new Set([1]))).toBe(2);
    expect(nextIdeaPosition([1, 2], new Set([1, 2]))).toBeNull();
    expect(nextIdeaPosition([], new Set())).toBeNull();
  });

  it("computes a percentage that never exceeds 100", () => {
    expect(percent(3, 8)).toBe(38);
    expect(percent(9, 8)).toBe(100);
    expect(percent(0, 0)).toBe(0);
  });
});

describe("generated covers", () => {
  it("gives the same colours to the same book and different colours to different books", () => {
    expect(coverColors("The Power of Now")).toEqual(coverColors("The Power of Now"));
    expect(coverColors("The Power of Now")).not.toEqual(coverColors("Atomic Habits"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });
});
