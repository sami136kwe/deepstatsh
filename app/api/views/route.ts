import { NextResponse } from "next/server";
import { parseJson, requireApiUser, serverError } from "@/lib/api";
import { recordActivity } from "@/lib/activity";
import { viewBodySchema } from "@/lib/validation/api";

export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, viewBodySchema);
  if (!body.ok) return body.response;
  const { cardId, action, day } = body.data;

  const { error } = await auth.supabase.from("card_views").insert({ user_id: auth.user.id, card_id: cardId, action });
  if (error) return serverError("views", error);
  const streak = await recordActivity(auth.supabase, day);
  return NextResponse.json({ ok: true, streak });
}
