import { NextResponse } from "next/server";
import { parseQuery, requireApiUser, serverError } from "@/lib/api";
import { cardsByIds } from "@/lib/cards";
import { historyQuerySchema } from "@/lib/validation/api";

/** Cards the user has read, newest first, with filters and full-text search. */
export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const query = parseQuery(request, historyQuerySchema);
  if (!query.ok) return query.response;
  const { supabase, user } = auth;
  const q = query.data;

  try {
    const { data: profile } = await supabase.from("profiles").select("language").eq("id", user.id).single();
    const language = profile?.language === "en" ? "en" : "fr";
    const { data, error } = await supabase.rpc("history_cards", {
      p_language: language,
      p_category: q.category,
      p_sub: q.sub,
      p_stashed: q.stashed === "1",
      p_from: q.from,
      p_to: q.to,
      p_q: q.q || undefined,
      p_limit: q.limit,
      p_offset: q.offset,
    });
    if (error) throw error;
    const cards = await cardsByIds(supabase, data.map((r) => r.card_id), language);
    const byId = new Map(cards.map((c) => [c.id, c]));
    const items = data
      .map((r) => ({ card: byId.get(r.card_id), read_count: r.read_count, last_read_at: r.last_read_at, first_read_at: r.first_read_at, is_stashed: r.is_stashed }))
      .filter((i) => i.card);
    return NextResponse.json({ items, total: Number(data[0]?.total_count ?? 0), hasMore: data.length === q.limit });
  } catch (error) {
    return serverError("history", error);
  }
}
