import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { pickLanguageRows, type ContentLanguage } from "./books-logic";
import { CARD_FIELDS, type CardSummary } from "./cards";

type Db = SupabaseClient<Database>;
type OverviewRow = Database["public"]["Views"]["book_overview"]["Row"];

export type BookItem = {
  id: string;
  slug: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  published_year: number | null;
  is_public_domain: boolean;
  popularity_score: number;
  average_rating: number | null;
  is_featured: boolean;
  info_link: string | null;
  language: ContentLanguage;
  summary: string | null;
  idea_count: number;
  /** True when the book is shown in another language than the preferred one. */
  fallback: boolean;
};

export type BookWithProgress = BookItem & { done: number };

function toItem(row: OverviewRow & { fallback: boolean }): BookItem {
  return {
    id: row.id!,
    slug: row.slug,
    title: row.title ?? "",
    author: row.author ?? "",
    cover_url: row.cover_url,
    published_year: row.published_year,
    is_public_domain: row.is_public_domain ?? false,
    popularity_score: Number(row.popularity_score ?? 0),
    average_rating: row.average_rating === null ? null : Number(row.average_rating),
    is_featured: row.is_featured ?? false,
    info_link: row.info_link,
    language: row.language === "fr" ? "fr" : "en",
    summary: row.summary,
    idea_count: row.idea_count ?? 0,
    fallback: row.fallback,
  };
}

export type ListOptions = {
  /** Main category ids: only books with at least one of these topics. */
  topicIds?: string[];
  /** Only these books. */
  bookIds?: string[];
  excludeIds?: string[];
  featured?: boolean;
  /** Text to find in the title or the author. */
  search?: string;
  order?: "popular" | "recent";
  limit?: number;
};

/** Readable books (at least one idea), one entry per book, in the user's language when possible. */
export async function listBooks(db: Db, preferred: ContentLanguage, options: ListOptions = {}): Promise<BookItem[]> {
  const { limit = 12, order = "popular" } = options;
  let ids = options.bookIds;
  if (options.topicIds) {
    if (options.topicIds.length === 0) return [];
    const { data, error } = await db.from("book_topics").select("book_id").in("category_id", options.topicIds);
    if (error) throw new Error(error.message);
    const inTopics = new Set(data.map((r) => r.book_id));
    ids = ids ? ids.filter((id) => inTopics.has(id)) : [...inTopics];
  }
  if (ids && ids.length === 0) return [];

  let query = db.from("book_overview").select("*").gt("idea_count", 0);
  if (ids) query = query.in("id", ids);
  if (options.excludeIds?.length) query = query.not("id", "in", `(${options.excludeIds.join(",")})`);
  if (options.featured) query = query.eq("is_featured", true);
  if (options.search) {
    const term = options.search.replace(/[%,()*\\]/g, " ").trim();
    if (term) query = query.or(`title.ilike.%${term}%,author.ilike.%${term}%`);
  }
  query =
    order === "recent"
      ? query.order("published_year", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })
      : query.order("popularity_score", { ascending: false }).order("title");
  const { data, error } = await query.limit(limit * 2 + 2);
  if (error) throw new Error(error.message);
  return pickLanguageRows(data, preferred).slice(0, limit).map(toItem);
}

/** One book, even if it has no readable idea yet. */
export async function getBook(db: Db, id: string, preferred: ContentLanguage): Promise<BookItem | null> {
  const { data, error } = await db.from("book_overview").select("*").eq("id", id);
  if (error) throw new Error(error.message);
  if (data.length === 0) return null;
  const picked = pickLanguageRows(data, preferred)[0];
  if (picked) return toItem(picked);
  const any = data.find((r) => r.language === preferred) ?? data[0]!;
  return toItem({ ...any, fallback: any.language !== preferred });
}

export type Topic = { id: string; slug: string; name_fr: string; name_en: string; icon: string | null };

export async function bookTopics(db: Db, bookId: string): Promise<Topic[]> {
  const { data, error } = await db.from("book_topics").select("categories(id, slug, name_fr, name_en, icon)").eq("book_id", bookId);
  if (error) throw new Error(error.message);
  return data.map((r) => r.categories).filter((c): c is Topic => !!c);
}

export type IdeaSummary = CardSummary & { position: number };

/** The numbered ideas of a book in one language. Positions come from `cards` itself, the source of truth. */
export async function getIdeas(db: Db, bookId: string, language: ContentLanguage): Promise<IdeaSummary[]> {
  const [details, positions] = await Promise.all([
    db.from("card_details").select(`${CARD_FIELDS}, story`).eq("book_id", bookId).eq("language", language).eq("status", "published"),
    db.from("cards").select("id, position").eq("book_id", bookId).eq("status", "published").not("position", "is", null),
  ]);
  if (details.error) throw new Error(details.error.message);
  if (positions.error) throw new Error(positions.error.message);
  const byId = new Map(positions.data.map((c) => [c.id, c.position as number]));
  return details.data
    .filter((idea) => byId.has(idea.id))
    .map((idea) => ({ ...idea, position: byId.get(idea.id)! }))
    .sort((a, b) => a.position - b.position);
}

export type BookProgress = {
  completed: Set<number>;
  completedCardIds: Set<string>;
  isSaved: boolean;
  startedAt: string | null;
  completedAt: string | null;
};

export async function getProgress(db: Db, userId: string, bookId: string): Promise<BookProgress> {
  const [progress, state] = await Promise.all([
    db.from("user_idea_progress").select("card_id, cards(position)").eq("user_id", userId).eq("book_id", bookId),
    db.from("user_books").select("is_saved, started_at, completed_at").eq("user_id", userId).eq("book_id", bookId).maybeSingle(),
  ]);
  if (progress.error) throw new Error(progress.error.message);
  if (state.error) throw new Error(state.error.message);
  return {
    completed: new Set(progress.data.map((p) => p.cards?.position).filter((p): p is number => typeof p === "number")),
    completedCardIds: new Set(progress.data.map((p) => p.card_id)),
    isSaved: state.data?.is_saved ?? false,
    startedAt: state.data?.started_at ?? null,
    completedAt: state.data?.completed_at ?? null,
  };
}

/** How many ideas the user has finished, per book. */
export async function doneCounts(db: Db, userId: string, bookIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (bookIds.length === 0) return counts;
  const { data, error } = await db.from("user_idea_progress").select("book_id").eq("user_id", userId).in("book_id", bookIds);
  if (error) throw new Error(error.message);
  for (const row of data) counts.set(row.book_id, (counts.get(row.book_id) ?? 0) + 1);
  return counts;
}

export type LibraryShelf = "in_progress" | "saved" | "completed";

/** The user's books for a shelf of the library. */
export async function libraryBooks(db: Db, userId: string, shelf: LibraryShelf, preferred: ContentLanguage): Promise<BookWithProgress[]> {
  let query = db.from("user_books").select("book_id, last_opened_at").eq("user_id", userId);
  if (shelf === "in_progress") query = query.not("started_at", "is", null).is("completed_at", null);
  else if (shelf === "saved") query = query.eq("is_saved", true);
  else query = query.not("completed_at", "is", null);
  const { data, error } = await query.order("last_opened_at", { ascending: false, nullsFirst: false }).limit(60);
  if (error) throw new Error(error.message);
  const ids = data.map((r) => r.book_id);
  if (ids.length === 0) return [];
  const [books, counts] = await Promise.all([listBooks(db, preferred, { bookIds: ids, limit: 60 }), doneCounts(db, userId, ids)]);
  const byId = new Map(books.map((b) => [b.id, b]));
  return ids.map((id) => byId.get(id)).filter((b): b is BookItem => !!b).map((b) => ({ ...b, done: counts.get(b.id) ?? 0 }));
}
