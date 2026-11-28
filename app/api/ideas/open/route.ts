import { NextResponse } from "next/server";
import { jsonError, parseJson, requireApiUser, serverError } from "@/lib/api";
import { ideaOpenBodySchema } from "@/lib/validation/api";

/**
 * An idea was opened: the book is marked as started and the reading is logged
 * ("seen" the first time, "reread" afterwards, which never counts for the streak).
 */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, ideaOpenBodySchema);
  if (!body.ok) return body.response;
  const { supabase, user } = auth;
  const { cardId } = body.data;

  const { data: card } = await supabase.from("cards").select("book_id").eq("id", cardId).not("book_id", "is", null).maybeSingle();
  if (!card?.book_id) return jsonError(404, "idea_not_found");

  const { count } = await supabase
    .from("user_idea_progress")
    .select("card_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("card_id", cardId);
  const action = (count ?? 0) > 0 ? "reread" : "seen";

  const [touch, view] = await Promise.all([
    supabase.rpc("touch_book", { p_book: card.book_id }),
    supabase.from("card_views").insert({ user_id: user.id, card_id: cardId, action }),
  ]);
  if (touch.error) return serverError("ideas:touch", touch.error);
  if (view.error) return serverError("ideas:view", view.error);
  return NextResponse.json({ ok: true, action });
}
