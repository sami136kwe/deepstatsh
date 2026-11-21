/**
 * SM-2 spaced repetition, adapted to a 4-button scale:
 *   1 = Again (forgot), 2 = Hard, 3 = Good, 4 = Easy.
 * Each button maps to an SM-2 quality grade (0..5) which drives the ease factor.
 */

export type ReviewRating = 1 | 2 | 3 | 4;

export type ReviewState = {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
};

export type ScheduledReview = ReviewState & {
  rating: ReviewRating;
  nextReviewAt: Date;
};

export const INITIAL_REVIEW_STATE: ReviewState = {
  intervalDays: 0,
  easeFactor: 2.5,
  repetitions: 0,
};

export const MIN_EASE_FACTOR = 1.3;
export const MAX_INTERVAL_DAYS = 365;
/** A forgotten card comes back in the same session, ten minutes later. */
export const RELEARN_DELAY_MINUTES = 10;

const QUALITY_BY_RATING: Record<ReviewRating, number> = { 1: 1, 2: 3, 3: 4, 4: 5 };

export function nextEaseFactor(easeFactor: number, quality: number): number {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const next = Math.max(MIN_EASE_FACTOR, easeFactor + delta);
  return Math.round(next * 100) / 100;
}

export function scheduleReview(
  state: ReviewState,
  rating: ReviewRating,
  now: Date = new Date(),
): ScheduledReview {
  const quality = QUALITY_BY_RATING[rating];
  const easeFactor = nextEaseFactor(state.easeFactor, quality);

  if (rating === 1) {
    return {
      rating,
      easeFactor,
      repetitions: 0,
      intervalDays: 0,
      nextReviewAt: new Date(now.getTime() + RELEARN_DELAY_MINUTES * 60_000),
    };
  }

  let intervalDays: number;
  if (state.repetitions === 0) {
    intervalDays = rating === 4 ? 4 : 1;
  } else if (state.repetitions === 1) {
    intervalDays = rating === 2 ? 3 : rating === 4 ? 8 : 6;
  } else {
    const base = Math.max(state.intervalDays, 1);
    if (rating === 2) intervalDays = base * 1.2;
    else if (rating === 4) intervalDays = base * easeFactor * 1.3;
    else intervalDays = base * easeFactor;
  }
  intervalDays = Math.min(MAX_INTERVAL_DAYS, Math.max(1, Math.round(intervalDays)));

  return {
    rating,
    easeFactor,
    repetitions: state.repetitions + 1,
    intervalDays,
    nextReviewAt: new Date(now.getTime() + intervalDays * 86_400_000),
  };
}
