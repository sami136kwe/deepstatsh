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

/** Loads published cards by id and returns them in the order of `ids`. */
export async function cardsByIds(db: SupabaseClient<Database>, ids: string[]): Promise<CardSummary[]> {
  if (ids.length === 0) return [];
  const { data, error } = await db.from("card_details").select(CARD_FIELDS).in("id", ids).eq("status", "published");
  if (error) throw new Error(error.message);
  const byId = new Map(data.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter((c): c is CardSummary => !!c);
}
