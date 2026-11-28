import { NextResponse } from "next/server";
import { jsonError, parseJson, requireApiUser, serverError } from "@/lib/api";
import { recordActivity } from "@/lib/activity";
import { ideaCompleteBodySchema } from "@/lib/validation/api";

/**
 * "Continue": the idea is finished, the next one unlocks. The database refuses an
 * idea whose predecessors are not done. Finishing a new idea counts for the streak;
 * finishing one a second time does not.
 */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, ideaCompleteBodySchema);
  if (!body.ok) return body.response;
  const { supabase, user } = auth;
  const { cardId, day } = body.data;

  const { count: before } = await supabase
    .from("user_idea_progress")
    .select("card_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("card_id", cardId);

  const { data, error } = await supabase.rpc("complete_idea", { p_card: cardId });
  if (error) {
    if (/locked/i.test(error.message)) return jsonError(409, "idea_locked");
    if (/not a book idea/i.test(error.message)) return jsonError(404, "idea_not_found");
    return serverError("ideas:complete", error);
  }
  const progress = data[0];
  const streak = (before ?? 0) === 0 ? await recordActivity(supabase, day) : null;
  return NextResponse.json({
    ok: true,
    bookId: progress?.r_book,
    done: progress?.r_done ?? 0,
    total: progress?.r_total ?? 0,
    bookCompleted: progress?.r_completed ?? false,
    streak,
  });
}
