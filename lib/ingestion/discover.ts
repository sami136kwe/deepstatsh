import { bookDedupKey } from "./text";
import type { BookCandidate } from "./sources/types";

export type MergedBook = BookCandidate & { dedupKey: string; popularityScore: number };

export const MIN_RATINGS = 10;
export const MIN_AVERAGE_RATING = 3.6;
/** Bayesian prior: books with few ratings are pulled towards the global mean. */
const PRIOR_MEAN = 3.8;
const PRIOR_WEIGHT = 50;

/**
 * Popularity score in [0, 100]: 60 points for the Bayesian-adjusted rating,
 * up to 40 points for the volume of ratings (log scale, 10 000 ratings = max).
 */
export function popularityScore(averageRating: number | null, ratingsCount: number): number {
  if (!averageRating || ratingsCount <= 0) return 0;
  const bayes = (ratingsCount * averageRating + PRIOR_WEIGHT * PRIOR_MEAN) / (ratingsCount + PRIOR_WEIGHT);
  const ratingPart = (bayes / 5) * 60;
  const volumePart = Math.min(40, (Math.log10(1 + ratingsCount) / 4) * 40);
  return Math.round((ratingPart + volumePart) * 100) / 100;
}

/** Combines Google Books and Open Library results that describe the same book. */
export function mergeCandidates(candidates: BookCandidate[]): MergedBook[] {
  const byKey = new Map<string, MergedBook>();
  for (const c of candidates) {
    const key = bookDedupKey(c.title, c.author);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, { ...c, dedupKey: key, popularityScore: 0 });
      continue;
    }
    const best = (c.ratingsCount ?? 0) > (existing.ratingsCount ?? 0) ? c : existing;
    byKey.set(key, {
      ...existing,
      googleBooksId: existing.googleBooksId ?? c.googleBooksId,
      openLibraryId: existing.openLibraryId ?? c.openLibraryId,
      language: existing.language ?? c.language,
      publishedYear:
        existing.publishedYear && c.publishedYear
          ? Math.min(existing.publishedYear, c.publishedYear)
          : (existing.publishedYear ?? c.publishedYear),
      coverUrl: existing.coverUrl ?? c.coverUrl,
      description:
        (existing.description?.length ?? 0) >= (c.description?.length ?? 0) ? existing.description : c.description,
      averageRating: best.averageRating,
      ratingsCount: best.ratingsCount,
      infoLink: existing.infoLink ?? c.infoLink,
    });
  }
  return [...byKey.values()].map((b) => ({ ...b, popularityScore: popularityScore(b.averageRating, b.ratingsCount) }));
}

export function passesPopularityFilter(book: Pick<BookCandidate, "averageRating" | "ratingsCount">): boolean {
  return (book.ratingsCount ?? 0) >= MIN_RATINGS && (book.averageRating ?? 0) >= MIN_AVERAGE_RATING;
}

/** Keeps good, popular books not already known, best first. */
export function selectBooks(candidates: BookCandidate[], knownKeys: Set<string>, limit: number): MergedBook[] {
  return mergeCandidates(candidates)
    .filter((b) => !knownKeys.has(b.dedupKey) && passesPopularityFilter(b))
    .sort((a, b) => b.popularityScore - a.popularityScore)
    .slice(0, limit);
}

/**
 * Conservative public domain test that holds in both the US and the EU:
 * published more than 95 years ago AND (author dead for more than 70 years,
 * or the work is older than 1900 when the death year is unknown).
 */
export function isPublicDomain(
  publishedYear: number | null,
  authorDeathYear: number | null,
  currentYear: number = new Date().getUTCFullYear(),
): boolean {
  if (publishedYear === null) return false;
  const usOk = publishedYear <= currentYear - 96;
  if (!usOk) return false;
  if (authorDeathYear !== null) return authorDeathYear <= currentYear - 71;
  return publishedYear < 1900;
}
