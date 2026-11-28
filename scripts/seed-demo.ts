/**
 * Inserts the hand-written starter cards (supabase/seed/demo-cards.ts).
 * Safe to run several times: cards are keyed by content hash.
 */
import { bookDedupKey, contentHash } from "@/lib/ingestion/text";
import { DEMO_CARDS } from "@/supabase/seed/demo-cards";
import { LIBRARY as DEMO_BOOKS } from "@/supabase/seed/library";
import { createServiceClient, seedCategories, seedDemoBooks } from "./lib";

async function main() {
  const db = createServiceClient();
  await seedCategories(db);
  const { data: categories, error } = await db.from("categories").select("id, slug");
  if (error) throw new Error(error.message);
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  // Demo cards from an older version of the content (no story) are replaced, not duplicated.
  // This also removes the saves and history attached to them, which is fine for demo data.
  const keep = new Set(DEMO_CARDS.flatMap((c) => [contentHash("fr", c.fr.title, `${c.fr.story}\n${c.fr.body}`), contentHash("en", c.en.title, `${c.en.story}\n${c.en.body}`)]));
  const { data: manual, error: manualError } = await db
    .from("card_translations")
    .select("card_id, content_hash, cards!inner(source_type)")
    .eq("cards.source_type", "manual");
  if (manualError) throw new Error(manualError.message);
  const stale = [...new Set(manual.filter((t) => !keep.has(t.content_hash)).map((t) => t.card_id))];
  if (stale.length > 0) await db.from("cards").delete().in("id", stale);

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

    const hashes = {
      fr: contentHash("fr", card.fr.title, `${card.fr.story}\n${card.fr.body}`),
      en: contentHash("en", card.en.title, `${card.en.story}\n${card.en.body}`),
    };
    const { data: existing, error: existingError } = await db
      .from("card_translations")
      .select("card_id")
      .in("content_hash", [hashes.fr, hashes.en]);
    if (existingError) throw new Error(existingError.message);
    const existingIds = [...new Set(existing.map((e) => e.card_id))];
    // Already stored as one card with both versions: nothing to do.
    if (existing.length === 2 && existingIds.length === 1) {
      inserted += 1;
      continue;
    }
    // Older single-language rows (before translations existed) are rebuilt as a pair.
    if (existingIds.length > 0) await db.from("cards").delete().in("id", existingIds);

    const { data: row, error: cardError } = await db
      .from("cards")
      .insert({
        category_id: categoryId,
        book_id: bookId,
        difficulty: card.difficulty,
        status: "published",
        source_type: "manual",
        human_reviewed: true,
      })
      .select("id")
      .single();
    if (cardError) throw new Error(`${card.fr.title}: ${cardError.message}`);

    const { error: translationError } = await db.from("card_translations").insert(
      (["fr", "en"] as const).map((language) => ({
        card_id: row.id,
        language,
        title: card[language].title,
        story: card[language].story,
        body: card[language].body,
        action_step: card[language].action_step,
        status: "published",
        content_hash: hashes[language],
      })),
    );
    if (translationError) {
      await db.from("cards").delete().eq("id", row.id);
      throw new Error(`${card.fr.title}: ${translationError.message}`);
    }
    inserted += 1;
  }
  const library = await seedDemoBooks(db, DEMO_BOOKS);
  console.log(`Demo library ready: ${library.books} book(s), ${library.ideas} ideas.`);
  console.log(`Demo cards ready: ${inserted} (each with a French and an English version)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
