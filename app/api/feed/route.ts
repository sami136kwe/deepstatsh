import { NextResponse } from "next/server";
import { jsonError, parseQuery, requireApiUser, serverError } from "@/lib/api";
import { cardsByIds } from "@/lib/cards";
import { interleave, mixFeed } from "@/lib/feed/mix";
import { feedQuerySchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const query = parseQuery(request, feedQuerySchema);
  if (!query.ok) return query.response;
  const { supabase, user } = auth;
  const { size, since, exclude } = query.data;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests, language, daily_goal, include_reread, reread_ratio")
      .eq("id", user.id)
      .single();
    if (!profile) return jsonError(404, "profile_not_found");
    const language = profile.language === "en" ? "en" : "fr";

    // New cards: by default the whole page. With "include already read cards", a share goes to re-reads.
    const rereadWanted = profile.include_reread ? Math.max(1, Math.round((size * profile.reread_ratio) / 100)) : 0;
    const newWanted = size - rereadWanted;

    const hasInterests = profile.interests.length > 0;
    const [interest, discovery] = await Promise.all([
      supabase.rpc("feed_candidates", { p_language: language, p_category_ids: profile.interests, p_include: true, p_limit: size * 3 }),
      hasInterests
        ? supabase.rpc("feed_candidates", { p_language: language, p_category_ids: profile.interests, p_include: false, p_limit: size })
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (interest.error) throw interest.error;
    if (discovery.error) throw discovery.error;

    const mixed = mixFeed(interest.data, discovery.data ?? [], newWanted);
    // No new card left in the chosen categories: the feed turns into a re-read session.
    const fallback = mixed.length === 0;
    const rereadCount = fallback ? size : rereadWanted + (newWanted - mixed.length);

    let rereadRows: { card_id: string; read_count: number }[] = [];
    if (rereadCount > 0) {
      const { data, error } = await supabase.rpc("reread_candidates", { p_language: language, p_mode: "random", p_limit: rereadCount, p_exclude: exclude });
      if (error) throw error;
      rereadRows = data;
    }

    const discoveryIds = new Set(mixed.filter((m) => m.discovery).map((m) => m.id));
    const [newCards, rereadCards] = await Promise.all([
      cardsByIds(supabase, mixed.map((m) => m.id), language),
      cardsByIds(supabase, rereadRows.map((r) => r.card_id), language),
    ]);
    const counts = new Map(rereadRows.map((r) => [r.card_id, r.read_count]));
    const cards = interleave(
      newCards.map((c) => ({ ...c, discovery: discoveryIds.has(c.id), reread: false, read_count: null as number | null })),
      rereadCards.map((c) => ({ ...c, discovery: false, reread: true, read_count: counts.get(c.id) ?? 1 })),
    );

    let todayCount = 0;
    let rereadToday = 0;
    if (since) {
      const count = (action: "seen" | "reread") =>
        supabase
          .from("card_views")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("action", action)
          .gte("created_at", since);
      const [seen, reread] = await Promise.all([count("seen"), count("reread")]);
      todayCount = seen.count ?? 0;
      rereadToday = reread.count ?? 0;
    }

    return NextResponse.json({
      cards,
      todayCount,
      rereadToday,
      dailyGoal: profile.daily_goal,
      fallback: fallback && cards.length > 0,
      includeReread: profile.include_reread,
      rereadRatio: profile.reread_ratio,
    });
  } catch (error) {
    return serverError("feed", error);
  }
}
