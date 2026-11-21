import { NextResponse } from "next/server";
import { parseQuery, serverError } from "@/lib/api";
import { CARD_FIELDS } from "@/lib/cards";
import { resolveLocale } from "@/lib/i18n/server";
import { getProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { searchQuerySchema } from "@/lib/validation/api";

/** Escapes PostgREST ilike wildcards and filter separators. */
function likePattern(q: string): string {
  return `%${q.replace(/[%_\\]/g, (c) => `\\${c}`).replace(/[,()]/g, " ")}%`;
}

export async function GET(request: Request) {
  const query = parseQuery(request, searchQuerySchema);
  if (!query.ok) return query.response;
  const q = query.data.q;
  const supabase = await createClient();
  const locale = await resolveLocale((await getProfile())?.language);
  const pattern = likePattern(q);

  try {
    const [cards, books, categories] = await Promise.all([
      supabase
        .from("cards")
        .select("id")
        .eq("status", "published")
        .eq("language", locale)
        .textSearch("search", q, { type: "websearch", config: locale === "fr" ? "french" : "english" })
        .limit(20),
      supabase
        .from("books")
        .select("id, title, author, cover_url, published_year")
        .or(`title.ilike.${pattern},author.ilike.${pattern}`)
        .order("popularity_score", { ascending: false })
        .limit(10),
      supabase
        .from("categories")
        .select("id, slug, name_fr, name_en, icon, parent_id")
        .or(`name_fr.ilike.${pattern},name_en.ilike.${pattern}`)
        .order("sort_order")
        .limit(10),
    ]);
    if (cards.error) throw cards.error;
    if (books.error) throw books.error;
    if (categories.error) throw categories.error;

    const ids = cards.data.map((c) => c.id);
    const details = ids.length
      ? await supabase.from("card_details").select(CARD_FIELDS).in("id", ids)
      : { data: [], error: null };
    if (details.error) throw details.error;
    const byId = new Map(details.data.map((c) => [c.id, c]));

    return NextResponse.json({
      cards: ids.map((id) => byId.get(id)).filter(Boolean),
      books: books.data,
      categories: categories.data,
    });
  } catch (error) {
    return serverError("search", error);
  }
}
