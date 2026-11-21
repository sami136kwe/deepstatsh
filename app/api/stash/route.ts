import { NextResponse } from "next/server";
import { jsonError, parseJson, requireApiUser, serverError } from "@/lib/api";
import { recordActivity } from "@/lib/activity";
import { noteBodySchema, stashBodySchema, unstashBodySchema } from "@/lib/validation/api";

/** Save a card: stash row, view log, and a review schedule due right away. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, stashBodySchema);
  if (!body.ok) return body.response;
  const { supabase, user } = auth;
  const { cardId, day } = body.data;

  const { error } = await supabase.from("stashes").upsert(
    { user_id: user.id, card_id: cardId },
    { onConflict: "user_id,card_id", ignoreDuplicates: true },
  );
  if (error) {
    if (error.code === "23503") return jsonError(404, "card_not_found");
    return serverError("stash", error);
  }
  const [view, review] = await Promise.all([
    supabase.from("card_views").insert({ user_id: user.id, card_id: cardId, action: "stashed" }),
    supabase
      .from("card_reviews")
      .upsert({ user_id: user.id, card_id: cardId }, { onConflict: "user_id,card_id", ignoreDuplicates: true }),
  ]);
  if (view.error) return serverError("stash:view", view.error);
  if (review.error) return serverError("stash:review", review.error);
  const streak = await recordActivity(supabase, day);
  return NextResponse.json({ ok: true, streak });
}

export async function DELETE(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, unstashBodySchema);
  if (!body.ok) return body.response;
  const { supabase, user } = auth;

  const [stash, review] = await Promise.all([
    supabase.from("stashes").delete().eq("user_id", user.id).eq("card_id", body.data.cardId),
    supabase.from("card_reviews").delete().eq("user_id", user.id).eq("card_id", body.data.cardId),
  ]);
  if (stash.error) return serverError("unstash", stash.error);
  if (review.error) return serverError("unstash:review", review.error);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, noteBodySchema);
  if (!body.ok) return body.response;
  const note = body.data.note?.trim() ? body.data.note.trim() : null;

  const { data, error } = await auth.supabase
    .from("stashes")
    .update({ note })
    .eq("user_id", auth.user.id)
    .eq("card_id", body.data.cardId)
    .select("card_id");
  if (error) return serverError("note", error);
  if (data.length === 0) return jsonError(404, "not_stashed");
  return NextResponse.json({ ok: true, note });
}
