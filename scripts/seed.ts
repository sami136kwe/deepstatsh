/**
 * Initial content seed: `npm run seed`
 *
 * 1. Upserts categories and discovery queries.
 * 2. For each main category, discovers the best books (Google Books + Open
 *    Library) until SEED_BOOKS_PER_CATEGORY books are known or the queries run out.
 * 3. Generates cards book by book (most popular first) until the category has
 *    SEED_CARDS_PER_CATEGORY published cards in both French and English.
 *
 * All progress lives in the database (books.processed_at, cards), so the script
 * resumes where it stopped. It halts cleanly when SEED_MAX_MODEL_CALLS is reached.
 *
 * Options: --category=<slug>  only seed one main category
 *          --discover-only     skip generation
 */
import { serverEnv } from "@/lib/env";
import { createPipelineDeps } from "@/lib/ingestion/deps";
import { BudgetExceededError } from "@/lib/ingestion/http";
import {
  discoverQuery,
  finishRun,
  loadCategoryTree,
  newCounters,
  processBook,
  startRun,
} from "@/lib/ingestion/pipeline";
import { argValue, createServiceClient, hasFlag, seedCategories, type ScriptDb } from "./lib";

const MAX_BOOK_ATTEMPTS = 3;

async function publishedCount(db: ScriptDb, categoryIds: string[], language: "fr" | "en"): Promise<number> {
  const { count, error } = await db
    .from("card_translations")
    .select("id, cards!inner(category_id)", { count: "exact", head: true })
    .in("cards.category_id", categoryIds)
    .eq("language", language)
    .eq("status", "published");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function bookCount(db: ScriptDb, categoryId: string): Promise<number> {
  const { count, error } = await db
    .from("books")
    .select("id", { count: "exact", head: true })
    .eq("source_category_id", categoryId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function main() {
  const db = createServiceClient();
  const env = serverEnv();
  const onlySlug = argValue("category");
  const discoverOnly = hasFlag("discover-only");

  const seeded = await seedCategories(db);
  console.log(`[seed] ${seeded.categories} categories, ${seeded.queries} queries`);

  const deps = createPipelineDeps(db, env, {
    maxModelCalls: env.SEED_MAX_MODEL_CALLS,
    timeBudgetSeconds: 3600 * 48,
    sourceType: "seed",
  });
  const counters = newCounters();
  const runStartedAt = new Date().toISOString();
  const runId = await startRun(db, "seed", {
    cardsPerCategory: env.SEED_CARDS_PER_CATEGORY,
    booksPerCategory: env.SEED_BOOKS_PER_CATEGORY,
    category: onlySlug ?? null,
  });
  let status: "success" | "partial" | "failed" = "success";

  try {
    const tree = await loadCategoryTree(db);
    const mains = onlySlug ? tree.mains.filter((m) => m.slug === onlySlug) : tree.mains;
    if (mains.length === 0) throw new Error(`unknown category: ${onlySlug}`);

    outer: for (const main of mains) {
      const subs = tree.childrenOf(main.id);
      const ids = [main.id, ...subs.map((s) => s.id)];

      // Discovery: run this category's queries that were not run during this seed.
      const { data: queries, error } = await db
        .from("ingestion_queries")
        .select("id, category_id, query_text, last_run_at")
        .eq("category_id", main.id)
        .order("last_run_at", { ascending: true, nullsFirst: true });
      if (error) throw new Error(error.message);
      for (const q of queries) {
        if ((await bookCount(db, main.id)) >= env.SEED_BOOKS_PER_CATEGORY) break;
        if (q.last_run_at && q.last_run_at >= runStartedAt) continue;
        try {
          await discoverQuery(deps, counters, q);
        } catch (e) {
          counters.errors.push({ at: new Date().toISOString(), scope: `query:${q.query_text}`, message: String(e) });
        }
      }
      console.log(`[seed] ${main.slug}: ${await bookCount(db, main.id)} books known`);
      if (discoverOnly) continue;

      // Generation until both languages reach the target.
      for (;;) {
        const [fr, en] = await Promise.all([publishedCount(db, ids, "fr"), publishedCount(db, ids, "en")]);
        console.log(`[seed] ${main.slug}: ${fr} fr / ${en} en published (target ${env.SEED_CARDS_PER_CATEGORY})`);
        if (Math.min(fr, en) >= env.SEED_CARDS_PER_CATEGORY) break;

        const { data: next, error: nextError } = await db
          .from("books")
          .select("*")
          .eq("source_category_id", main.id)
          .is("processed_at", null)
          .lt("process_attempts", MAX_BOOK_ATTEMPTS)
          .order("popularity_score", { ascending: false })
          .limit(1);
        if (nextError) throw new Error(nextError.message);
        const book = next[0];
        if (!book) {
          console.warn(`[seed] ${main.slug}: no unprocessed books left; add queries in supabase/seed/categories.ts and rerun`);
          status = "partial";
          break;
        }
        try {
          await processBook(deps, counters, runId, book, main, subs);
        } catch (e) {
          if (e instanceof BudgetExceededError) {
            console.warn(`[seed] model call budget reached (${env.SEED_MAX_MODEL_CALLS}); rerun to continue`);
            status = "partial";
            break outer;
          }
          counters.errors.push({ at: new Date().toISOString(), scope: `book:${book.title}`, message: String(e) });
          console.error(`[seed] book "${book.title}" failed: ${String(e)}`);
        }
      }
    }
  } catch (e) {
    status = "failed";
    counters.errors.push({ at: new Date().toISOString(), scope: "seed", message: String(e) });
    console.error(e);
  }

  if (status === "success" && counters.errors.length > 0) status = "partial";
  await finishRun(db, runId, counters, deps.model.callsUsed, status);
  console.log(
    `[seed] done (${status}): ${counters.booksFound} books, ${counters.cardsCreated} cards published, ` +
      `${counters.cardsRejected} rejected, ${deps.model.callsUsed} model calls`,
  );
  if (status === "failed") process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
