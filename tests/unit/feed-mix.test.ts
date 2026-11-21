import { describe, expect, it } from "vitest";
import { mixFeed, roundRobinByCategory, type FeedCandidate } from "@/lib/feed/mix";

function cards(prefix: string, category: string, n: number, base = 10): FeedCandidate[] {
  return Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, main_category_id: category, rank_score: base - i }));
}

describe("feed mixing", () => {
  it("gives about 20 % of the slots to discovery cards, spread out", () => {
    const interest = [...cards("a", "A", 20), ...cards("b", "B", 20)];
    const discovery = cards("d", "D", 20);
    const feed = mixFeed(interest, discovery, 20);
    expect(feed).toHaveLength(20);
    const discoveryPositions = feed.map((c, i) => (c.discovery ? i : -1)).filter((i) => i >= 0);
    expect(discoveryPositions).toHaveLength(4);
    expect(discoveryPositions).toEqual([4, 9, 14, 19]);
  });

  it("alternates interest categories instead of showing long runs", () => {
    const interest = [...cards("a", "A", 10, 100), ...cards("b", "B", 10, 1)];
    const feed = mixFeed(interest, [], 6, 0);
    expect(feed.map((c) => c.main_category_id)).toEqual(["A", "B", "A", "B", "A", "B"]);
  });

  it("fills with discovery cards when interest cards run out, and vice versa", () => {
    expect(mixFeed(cards("a", "A", 2), cards("d", "D", 10), 6)).toHaveLength(6);
    expect(mixFeed(cards("a", "A", 10), [], 6).every((c) => !c.discovery)).toBe(true);
  });

  it("never returns the same card twice", () => {
    const shared = cards("x", "A", 5);
    const feed = mixFeed(shared, shared, 10);
    expect(new Set(feed.map((c) => c.id)).size).toBe(feed.length);
    expect(feed).toHaveLength(5);
  });

  it("keeps the best card of each category first", () => {
    const rr = roundRobinByCategory([
      { id: "low", main_category_id: "A", rank_score: 1 },
      { id: "high", main_category_id: "A", rank_score: 9 },
    ]);
    expect(rr[0]?.id).toBe("high");
  });

  it("returns an empty page for size 0", () => {
    expect(mixFeed(cards("a", "A", 3), [], 0)).toEqual([]);
  });
});
