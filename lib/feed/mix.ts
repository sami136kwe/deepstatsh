/**
 * Feed mixing: turns two ranked candidate lists (cards inside the user's
 * interests, and discovery cards outside them) into one feed page.
 *
 * - Interest cards are interleaved round-robin across categories so the feed
 *   never shows a long run from a single category.
 * - About `discoveryRatio` of the slots (20 % by default) go to discovery cards,
 *   spread evenly rather than bunched at the end.
 * - When one list runs dry, the other fills the remaining slots.
 */

export type FeedCandidate = {
  id: string;
  main_category_id: string;
  rank_score: number;
};

export type MixedFeedItem = FeedCandidate & { discovery: boolean };

export const DEFAULT_DISCOVERY_RATIO = 0.2;

export function roundRobinByCategory<T extends FeedCandidate>(cards: T[]): T[] {
  const groups = new Map<string, T[]>();
  for (const card of [...cards].sort((a, b) => b.rank_score - a.rank_score)) {
    const list = groups.get(card.main_category_id);
    if (list) list.push(card);
    else groups.set(card.main_category_id, [card]);
  }
  const queues = [...groups.values()];
  const out: T[] = [];
  let remaining = cards.length;
  while (remaining > 0) {
    for (const queue of queues) {
      const next = queue.shift();
      if (next) {
        out.push(next);
        remaining -= 1;
      }
    }
  }
  return out;
}

export function mixFeed(
  interest: FeedCandidate[],
  discovery: FeedCandidate[],
  size: number,
  discoveryRatio: number = DEFAULT_DISCOVERY_RATIO,
): MixedFeedItem[] {
  if (size <= 0) return [];
  const ratio = Math.min(1, Math.max(0, discoveryRatio));
  const seen = new Set<string>();
  const interestQueue = roundRobinByCategory(interest).filter((c) => !seen.has(c.id) && seen.add(c.id));
  const discoveryQueue = roundRobinByCategory(discovery).filter((c) => !seen.has(c.id) && seen.add(c.id));

  const out: MixedFeedItem[] = [];
  let discoveryUsed = 0;
  while (out.length < size && (interestQueue.length > 0 || discoveryQueue.length > 0)) {
    const position = out.length + 1;
    // Discovery is due when its share so far is below the target ratio.
    const wantsDiscovery = ratio > 0 && discoveryUsed < Math.floor(position * ratio + 1e-9);
    const takeDiscovery =
      discoveryQueue.length > 0 && (wantsDiscovery || interestQueue.length === 0);
    if (takeDiscovery) {
      out.push({ ...discoveryQueue.shift()!, discovery: true });
      discoveryUsed += 1;
    } else if (interestQueue.length > 0) {
      out.push({ ...interestQueue.shift()!, discovery: false });
    }
  }
  return out;
}

/**
 * Spreads `extra` items evenly among `base` items (e.g. re-read cards among new
 * ones). Order inside each list is preserved; nothing is dropped.
 */
export function interleave<T, U>(base: T[], extra: U[]): (T | U)[] {
  const total = base.length + extra.length;
  if (extra.length === 0) return [...base];
  if (base.length === 0) return [...extra];
  const slots = new Set(extra.map((_, j) => Math.min(total - 1, Math.max(0, Math.round(((j + 1) * total) / (extra.length + 1)) - 1))));
  // Collisions can only happen with tiny lists: push to the next free slot.
  const taken = new Set<number>();
  for (const slot of [...slots].sort((a, b) => a - b)) {
    let s = slot;
    while (taken.has(s)) s += 1;
    taken.add(s);
  }
  let baseIndex = 0;
  let extraIndex = 0;
  const out: (T | U)[] = [];
  for (let i = 0; i < total; i++) out.push(taken.has(i) && extraIndex < extra.length ? extra[extraIndex++]! : base[baseIndex++]!);
  return out;
}
