import { NextResponse } from "next/server";
import { parseQuery, requireApiUser, serverError } from "@/lib/api";
import { cardsByIds } from "@/lib/cards";
import { rereadQuerySchema } from "@/lib/validation/api";

/** Cards to re-read (already read at least once), by mode. */
export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const query = parseQuery(request, rereadQuerySchema);
  if (!query.ok) return query.response;
  const { supabase, user } = auth;
  const { mode, category, size, exclude } = query.data;

  try {
    const { data: profile } = await supabase.from("profiles").select("language").eq("id", user.id).single();
    const language = profile?.language === "en" ? "en" : "fr";
    const { data, error } = await supabase.rpc("reread_candidates", {
      p_language: language,
      p_mode: mode,
      p_category: category,
      p_limit: size,
      p_exclude: exclude,
    });
    if (error) throw error;
    const cards = await cardsByIds(supabase, data.map((r) => r.card_id), language);
    const counts = new Map(data.map((r) => [r.card_id, r.read_count]));
    return NextResponse.json({ cards: cards.map((c) => ({ ...c, reread: true, read_count: counts.get(c.id) ?? 1 })) });
  } catch (error) {
    return serverError("reread", error);
  }
}
