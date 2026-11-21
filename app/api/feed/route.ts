import { NextResponse } from "next/server";
import { jsonError, parseQuery, requireApiUser, serverError } from "@/lib/api";
import { cardsByIds } from "@/lib/cards";
import { mixFeed } from "@/lib/feed/mix";
import { feedQuerySchema } from "@/lib/validation/api";

export async function GET(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const query = parseQuery(request, feedQuerySchema);
  if (!query.ok) return query.response;
  const { supabase, user } = auth;
  const { size, since } = query.data;

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests, language, daily_goal")
      .eq("id", user.id)
      .single();
    if (!profile) return jsonError(404, "profile_not_found");

    const hasInterests = profile.interests.length > 0;
    const [interest, discovery] = await Promise.all([
      supabase.rpc("feed_candidates", {
        p_language: profile.language,
        p_category_ids: profile.interests,
        p_include: true,
        p_limit: size * 3,
      }),
      hasInterests
        ? supabase.rpc("feed_candidates", {
            p_language: profile.language,
            p_category_ids: profile.interests,
            p_include: false,
            p_limit: size,
          })
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (interest.error) throw interest.error;
    if (discovery.error) throw discovery.error;

    const mixed = mixFeed(interest.data, discovery.data ?? [], size);
    const discoveryIds = new Set(mixed.filter((m) => m.discovery).map((m) => m.id));
    const cards = await cardsByIds(supabase, mixed.map((m) => m.id));

    let todayCount = 0;
    if (since) {
      const { count } = await supabase
        .from("card_views")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("action", "seen")
        .gte("created_at", since);
      todayCount = count ?? 0;
    }

    return NextResponse.json({
      cards: cards.map((c) => ({ ...c, discovery: discoveryIds.has(c.id) })),
      todayCount,
      dailyGoal: profile.daily_goal,
    });
  } catch (error) {
    return serverError("feed", error);
  }
}
