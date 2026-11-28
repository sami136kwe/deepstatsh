import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CATEGORY_SEED } from "@/supabase/seed/categories";
import type { BookSeed } from "@/supabase/seed/demo-books";
import { bookDedupKey, contentHash } from "@/lib/ingestion/text";

config({ path: ".env.local" });
config();

export type ScriptDb = ReturnType<typeof createServiceClient>;

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (see .env.example)");
  }
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((a) => a.startsWith(prefix))?.slice(prefix.length);
}

export function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** Upserts every category, subcategory and discovery query (idempotent). */
export async function seedCategories(db: ScriptDb): Promise<{ categories: number; queries: number }> {
  let categories = 0;
  let queries = 0;
  for (const [index, main] of CATEGORY_SEED.entries()) {
    const { data: parent, error } = await db
      .from("categories")
      .upsert(
        {
          slug: main.slug,
          name_fr: main.name_fr,
          name_en: main.name_en,
          icon: main.icon,
          description: main.description,
          description_en: main.description_en,
          sort_order: index,
          parent_id: null,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();
    if (error) throw new Error(`category ${main.slug}: ${error.message}`);
    categories += 1;

    const subs = main.subcategories.map((sub, subIndex) => ({
      slug: sub.slug,
      name_fr: sub.name_fr,
      name_en: sub.name_en,
      parent_id: parent.id,
      sort_order: subIndex,
    }));
    const { error: subError } = await db.from("categories").upsert(subs, { onConflict: "slug" });
    if (subError) throw new Error(`subcategories of ${main.slug}: ${subError.message}`);
    categories += subs.length;

    const rows = main.queries.map((query_text) => ({ category_id: parent.id, query_text }));
    const { error: qError } = await db
      .from("ingestion_queries")
      .upsert(rows, { onConflict: "category_id,query_text", ignoreDuplicates: true });
    if (qError) throw new Error(`queries of ${main.slug}: ${qError.message}`);
    queries += rows.length;
  }
  return { categories, queries };
}

/** Upserts the demo books, their ideas and topics. Idempotent: unchanged ideas are kept (so reading progress survives). */
export async function seedDemoBooks(db: ScriptDb, books: BookSeed[]): Promise<{ books: number; ideas: number }> {
  const { data: categories, error } = await db.from("categories").select("id, slug");
  if (error) throw new Error(error.message);
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  let ideaCount = 0;

  for (const seed of books) {
    const topicIds = seed.topics.map((slug) => {
      const id = idBySlug.get(slug);
      if (!id) throw new Error(`unknown topic ${slug}`);
      return id;
    });

    const { data: book, error: bookError } = await db
      .from("books")
      .upsert(
        {
          dedup_key: bookDedupKey(seed.title, seed.author),
          slug: seed.slug,
          title: seed.title,
          author: seed.author,
          published_year: seed.published_year,
          info_link: seed.info_link,
          is_public_domain: seed.is_public_domain,
          is_featured: seed.is_featured,
          source_category_id: topicIds[0],
          processed_at: new Date().toISOString(),
        },
        { onConflict: "dedup_key" },
      )
      .select("id")
      .single();
    if (bookError) throw new Error(`book ${seed.slug}: ${bookError.message}`);

    await db.from("book_topics").upsert(topicIds.map((category_id) => ({ book_id: book.id, category_id })), { onConflict: "book_id,category_id", ignoreDuplicates: true });
    const { error: summaryError } = await db
      .from("book_translations")
      .upsert({ book_id: book.id, language: "en", summary: seed.summary.en }, { onConflict: "book_id,language" });
    if (summaryError) throw new Error(`summary ${seed.slug}: ${summaryError.message}`);

    const hashes = new Map(seed.ideas.map((idea) => [idea.position, contentHash("en", idea.en.title, `${idea.en.story}\n${idea.en.body}`)]));
    // Remove this book's manual ideas that no longer match the seed (changed text or position).
    const { data: existing, error: existingError } = await db
      .from("cards")
      .select("id, position, card_translations(content_hash)")
      .eq("book_id", book.id)
      .eq("source_type", "manual");
    if (existingError) throw new Error(existingError.message);
    const upToDate = new Set<number>();
    const stale: string[] = [];
    for (const card of existing) {
      const hash = card.card_translations[0]?.content_hash;
      if (card.position && hashes.get(card.position) === hash) upToDate.add(card.position);
      else stale.push(card.id);
    }
    if (stale.length > 0) await db.from("cards").delete().in("id", stale);

    for (const idea of seed.ideas) {
      ideaCount += 1;
      if (upToDate.has(idea.position)) continue;
      const { data: card, error: cardError } = await db
        .from("cards")
        .insert({
          category_id: topicIds[0],
          book_id: book.id,
          position: idea.position,
          difficulty: idea.difficulty,
          status: "published",
          source_type: "manual",
          human_reviewed: true,
        })
        .select("id")
        .single();
      if (cardError) throw new Error(`${seed.slug} idea ${idea.position}: ${cardError.message}`);
      const { error: translationError } = await db.from("card_translations").insert({
        card_id: card.id,
        language: "en",
        title: idea.en.title,
        story: idea.en.story,
        body: idea.en.body,
        action_step: idea.en.action_step,
        status: "published",
        content_hash: hashes.get(idea.position)!,
      });
      if (translationError) {
        await db.from("cards").delete().eq("id", card.id);
        throw new Error(`${seed.slug} idea ${idea.position}: ${translationError.message}`);
      }
    }
  }
  return { books: books.length, ideas: ideaCount };
}
