import { NextResponse } from "next/server";
import { jsonError, parseJson, requireApiUser, serverError } from "@/lib/api";
import { recordActivity } from "@/lib/activity";
import { cardsByIds } from "@/lib/cards";
import { scheduleReview } from "@/lib/srs/sm2";
import { reviewBodySchema } from "@/lib/validation/api";

const SESSION_SIZE = 20;

/** Cards due for review now (oldest first), for today's session. */
export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const { data, error } = await auth.supabase
    .from("card_reviews")
    .select("card_id, next_review_at, repetitions")
    .eq("user_id", auth.user.id)
    .lte("next_review_at", new Date().toISOString())
    .order("next_review_at", { ascending: true })
    .limit(SESSION_SIZE);
  if (error) return serverError("review:list", error);
  try {
    const cards = await cardsByIds(auth.supabase, data.map((r) => r.card_id));
    return NextResponse.json({ cards });
  } catch (e) {
    return serverError("review:cards", e);
  }
}

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, reviewBodySchema);
  if (!body.ok) return body.response;
  const { supabase, user } = auth;
  const { cardId, rating, day } = body.data;

  const { data: current, error } = await supabase
    .from("card_reviews")
    .select("interval_days, ease_factor, repetitions")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .maybeSingle();
  if (error) return serverError("review:load", error);
  if (!current) return jsonError(404, "not_in_review");

  const next = scheduleReview(
    { intervalDays: current.interval_days, easeFactor: Number(current.ease_factor), repetitions: current.repetitions },
    rating,
  );
  const { error: updateError } = await supabase
    .from("card_reviews")
    .update({
      rating,
      interval_days: next.intervalDays,
      ease_factor: next.easeFactor,
      repetitions: next.repetitions,
      next_review_at: next.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("card_id", cardId);
  if (updateError) return serverError("review:update", updateError);
  const streak = await recordActivity(supabase, day);
  return NextResponse.json({ ok: true, intervalDays: next.intervalDays, nextReviewAt: next.nextReviewAt, streak });
}
