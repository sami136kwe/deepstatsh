import { NextResponse } from "next/server";
import { jsonError, parseJson, requireApiUser, serverError } from "@/lib/api";
import { reviewLaterBodySchema } from "@/lib/validation/api";

/** "Revoir plus tard": puts a card in the spaced-repetition queue, due now. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, reviewLaterBodySchema);
  if (!body.ok) return body.response;

  const { error } = await auth.supabase
    .from("card_reviews")
    .upsert(
      { user_id: auth.user.id, card_id: body.data.cardId, next_review_at: new Date().toISOString() },
      { onConflict: "user_id,card_id" },
    );
  if (error) {
    if (error.code === "23503") return jsonError(404, "card_not_found");
    return serverError("review:later", error);
  }
  return NextResponse.json({ ok: true });
}
