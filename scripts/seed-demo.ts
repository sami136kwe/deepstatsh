/**
 * Inserts the hand-written starter cards (supabase/seed/demo-cards.ts).
 * Safe to run several times: cards are keyed by content hash.
 */
import { bookDedupKey, contentHash } from "@/lib/ingestion/text";
import { DEMO_CARDS } from "@/supabase/seed/demo-cards";
import { createServiceClient, seedCategories } from "./lib";

async function main() {
  const db = createServiceClient();
  await seedCategories(db);
  const { data: categories, error } = await db.from("categories").select("id, slug");
  if (error) throw new Error(error.message);
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  let inserted = 0;
  for (const card of DEMO_CARDS) {
    const categoryId = idBySlug.get(card.subcategory);
    if (!categoryId) throw new Error(`unknown subcategory ${card.subcategory}`);

    let bookId: string | null = null;
    if (card.book) {
      const { data: book, error: bookError } = await db
        .from("books")
        .upsert(
          {
            dedup_key: bookDedupKey(card.book.title, card.book.author),
            title: card.book.title,
            author: card.book.author,
            published_year: card.book.published_year,
            info_link: card.book.info_link,
            is_public_domain: card.book.is_public_domain,
            source_category_id: categoryId,
            processed_at: new Date().toISOString(),
          },
          { onConflict: "dedup_key" },
        )
        .select("id")
        .single();
      if (bookError) throw new Error(bookError.message);
      bookId = book.id;
    }

    for (const language of ["fr", "en"] as const) {
      const v = card[language];
      const { error: cardError } = await db.from("cards").upsert(
        {
          category_id: categoryId,
          book_id: bookId,
          title: v.title,
          body: v.body,
          action_step: v.action_step,
          difficulty: card.difficulty,
          language,
          status: "published",
          source_type: "manual",
          human_reviewed: true,
          content_hash: contentHash(language, v.title, v.body),
        },
        { onConflict: "content_hash", ignoreDuplicates: true },
      );
      if (cardError) throw new Error(`${v.title}: ${cardError.message}`);
      inserted += 1;
    }
  }
  console.log(`Demo cards ready: ${inserted} (fr + en)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
