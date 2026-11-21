import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type CardDetails = Database["public"]["Views"]["card_details"]["Row"];

export const CARD_FIELDS =
  "id, category_id, main_category_id, category_slug, category_name_fr, category_name_en, category_icon, book_id, book_title, book_author, book_cover_url, book_info_link, title, body, action_step, quote, quote_author, difficulty, language" as const;

export type CardSummary = Pick<
  CardDetails,
  | "id"
  | "category_id"
  | "main_category_id"
  | "category_slug"
  | "category_name_fr"
  | "category_name_en"
  | "category_icon"
  | "book_id"
  | "book_title"
  | "book_author"
  | "book_cover_url"
  | "book_info_link"
  | "title"
  | "body"
  | "action_step"
  | "quote"
  | "quote_author"
  | "difficulty"
  | "language"
>;

export type CardLanguage = "fr" | "en";

/** Loads published cards by id, in one language, in the order of `ids`. */
export async function cardsByIds(db: SupabaseClient<Database>, ids: string[], language: CardLanguage): Promise<CardSummary[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from("card_details").select(CARD_FIELDS).in("id", ids).eq("language", language).eq("status", "published");
  if (error) throw new Error(error.message);
  const byId = new Map(data.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter((c): c is CardSummary => !!c);
}

/** One published card in `language`, falling back to its other language when missing. */
export async function cardById(db: SupabaseClient<Database>, id: string, language: CardLanguage): Promise<CardSummary | null> {
  const { data, error } = await db.from("card_details").select(CARD_FIELDS).eq("id", id).eq("status", "published");
  if (error) throw new Error(error.message);
  return data.find((c) => c.language === language) ?? data[0] ?? null;
}

/** Both versions of a card, for the "flip to the other language" button. */
export async function cardVersions(db: SupabaseClient<Database>, id: string): Promise<Partial<Record<CardLanguage, CardSummary>>> {
  const { data, error } = await db.from("card_details").select(CARD_FIELDS).eq("id", id).eq("status", "published");
  if (error) throw new Error(error.message);
  return Object.fromEntries(data.map((c) => [c.language, c]));
}
