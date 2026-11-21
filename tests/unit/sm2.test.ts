import { describe, expect, it } from "vitest";
import {
  INITIAL_REVIEW_STATE,
  MAX_INTERVAL_DAYS,
  MIN_EASE_FACTOR,
  nextEaseFactor,
  RELEARN_DELAY_MINUTES,
  scheduleReview,
  type ReviewRating,
} from "@/lib/srs/sm2";

const NOW = new Date("2026-01-01T08:00:00Z");
const days = (d: Date) => Math.round((d.getTime() - NOW.getTime()) / 86_400_000);

describe("SM-2 scheduling", () => {
  it("schedules a new card for tomorrow on Good, then 6 days, then interval x ease", () => {
    const first = scheduleReview(INITIAL_REVIEW_STATE, 3, NOW);
    expect(first.intervalDays).toBe(1);
    expect(first.repetitions).toBe(1);
    expect(days(first.nextReviewAt)).toBe(1);

    const second = scheduleReview(first, 3, NOW);
    expect(second.intervalDays).toBe(6);

    const third = scheduleReview(second, 3, NOW);
    expect(third.intervalDays).toBe(Math.round(6 * third.easeFactor));
    expect(third.repetitions).toBe(3);
  });

  it("keeps the ease factor at 2.5 for Good (SM-2 quality 4)", () => {
    expect(nextEaseFactor(2.5, 4)).toBe(2.5);
    expect(scheduleReview(INITIAL_REVIEW_STATE, 3, NOW).easeFactor).toBe(2.5);
  });

  it("resets repetitions and brings the card back within minutes on Again", () => {
    const learned = { intervalDays: 20, easeFactor: 2.6, repetitions: 5 };
    const again = scheduleReview(learned, 1, NOW);
    expect(again.repetitions).toBe(0);
    expect(again.intervalDays).toBe(0);
    expect(again.nextReviewAt.getTime() - NOW.getTime()).toBe(RELEARN_DELAY_MINUTES * 60_000);
    expect(again.easeFactor).toBeLessThan(2.6);
  });

  it("never lets the ease factor drop below 1.3", () => {
    let state = { ...INITIAL_REVIEW_STATE };
    for (let i = 0; i < 20; i++) state = scheduleReview(state, 1, NOW);
    expect(state.easeFactor).toBe(MIN_EASE_FACTOR);
  });

  it("orders intervals Hard < Good < Easy for a mature card", () => {
    const mature = { intervalDays: 10, easeFactor: 2.5, repetitions: 4 };
    const hard = scheduleReview(mature, 2, NOW).intervalDays;
    const good = scheduleReview(mature, 3, NOW).intervalDays;
    const easy = scheduleReview(mature, 4, NOW).intervalDays;
    expect(hard).toBeLessThan(good);
    expect(good).toBeLessThan(easy);
  });

  it("caps intervals at one year", () => {
    const old = { intervalDays: 300, easeFactor: 3, repetitions: 10 };
    expect(scheduleReview(old, 4, NOW).intervalDays).toBe(MAX_INTERVAL_DAYS);
  });

  it("always produces at least one day for a passing grade", () => {
    for (const rating of [2, 3, 4] as ReviewRating[]) {
      expect(scheduleReview(INITIAL_REVIEW_STATE, rating, NOW).intervalDays).toBeGreaterThanOrEqual(1);
    }
  });
});
