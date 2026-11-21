import { tokenize } from "./text";

/** Maximum run of identical consecutive words allowed between a card and its source. */
export const MAX_COPIED_RUN = 15;
/** Cosine similarity above which two cards are considered duplicates. */
export const DUPLICATE_SIMILARITY = 0.92;

/**
 * Length of the longest run of consecutive identical words shared by `a` and
 * `b` (comparison ignores case, accents and punctuation). Dynamic programming
 * over word positions, O(n*m) time and O(m) memory.
 */
export function longestCommonWordRun(a: string, b: string): number {
  const x = tokenize(a);
  const y = tokenize(b);
  if (x.length === 0 || y.length === 0) return 0;
  let prev = new Array<number>(y.length + 1).fill(0);
  let best = 0;
  for (let i = 1; i <= x.length; i++) {
    const cur = new Array<number>(y.length + 1).fill(0);
    for (let j = 1; j <= y.length; j++) {
      if (x[i - 1] === y[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

/** True when the card copies `MAX_COPIED_RUN` or more consecutive words of the source. */
export function copiesSource(cardText: string, sourceText: string | null | undefined): boolean {
  if (!sourceText) return false;
  return longestCommonWordRun(cardText, sourceText) >= MAX_COPIED_RUN;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new Error("vectors must have the same non-zero length");
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Index of the first vector in `pool` that duplicates `candidate`
 * (cosine similarity strictly above the threshold), or -1.
 */
export function findDuplicate(
  candidate: number[],
  pool: number[][],
  threshold: number = DUPLICATE_SIMILARITY,
): number {
  return pool.findIndex((vector) => cosineSimilarity(candidate, vector) > threshold);
}
