/**
 * Content ingestion pipeline:
 *   discovery (Google Books + Open Library) -> enrichment (Open Library,
 *   Wikipedia, Wikiquote) -> generation (Claude) -> rewrite -> scoring ->
 *   rule-based quality and style checks -> deduplication (hash + pgvector)
 *   -> publication, with every run logged in ingestion_runs.
 *
 * Shared by the daily cron route, the admin "rerun" action and `npm run seed`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CardModel, type LanguageVersion } from "@/lib/ai/cards";
import { selectBooks, isPublicDomain, type MergedBook } from "./discover";
import { embeddingText, toVectorLiteral, type Embedder } from "./embeddings";
import { BudgetExceededError } from "./http";
import { checkQuality } from "./quality";
import { DUPLICATE_SIMILARITY } from "./similarity";
import { searchGoogleBooks } from "./sources/googleBooks";
import { fetchOpenLibraryDescription, searchOpenLibrary } from "./sources/openLibrary";
import type { BookCandidate } from "./sources/types";
import { authorDeathYear, quoteExistsOnWikiquote } from "./sources/wikipedia";
import { checkStyle, structureSignature, type Language, type StructureSignature } from "./style";
import { contentHash, wordCount } from "./text";

export type Db = SupabaseClient<Database>;

export const PUBLISH_THRESHOLD = 7;
const LANGUAGES: Language[] = ["fr", "en"];
const NEW_BOOKS_PER_QUERY = 5;
const MAX_BOOK_ATTEMPTS = 3;

export type PipelineDeps = {
  db: Db;
  model: CardModel;
  embed: Embedder;
  userAgent: string;
  googleApiKey?: string;
  publishMode: "auto" | "review";
  sourceType: "seed" | "pipeline";
  /** Epoch ms after which no new book is started. */
  deadline: number;
  log: (message: string) => void;
};

export type RunCounters = {
  booksFound: number;
  cardsCreated: number;
  cardsRejected: number;
  errors: { at: string; scope: string; message: string }[];
};

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type BookRow = Database["public"]["Tables"]["books"]["Row"];

function errorMessage(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

export function newCounters(): RunCounters {
  return { booksFound: 0, cardsCreated: 0, cardsRejected: 0, errors: [] };
}

function recordError(counters: RunCounters, scope: string, error: unknown, log: (m: string) => void) {
  const message = errorMessage(error);
  counters.errors.push({ at: new Date().toISOString(), scope, message: message.slice(0, 500) });
  log(`[error] ${scope}: ${message}`);
}

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

export async function startRun(db: Db, source: "cron" | "seed" | "admin" | "manual", details: Record<string, unknown>) {
  const { data, error } = await db
    .from("ingestion_runs")
    .insert({ source, details: details as Database["public"]["Tables"]["ingestion_runs"]["Insert"]["details"] })
    .select("id")
    .single();
  if (error) throw new Error(`cannot start run: ${error.message}`);
  return data.id;
}

export async function finishRun(
  db: Db,
  runId: string,
  counters: RunCounters,
  modelCalls: number,
  status: "success" | "partial" | "failed",
) {
  const { error } = await db
    .from("ingestion_runs")
    .update({
      finished_at: new Date().toISOString(),
      status,
      books_found: counters.booksFound,
      cards_created: counters.cardsCreated,
      cards_rejected: counters.cardsRejected,
      model_calls: modelCalls,
      errors: counters.errors,
    })
    .eq("id", runId);
  if (error) throw new Error(`cannot finish run: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Discovery and enrichment
// ---------------------------------------------------------------------------

async function knownBookKeys(db: Db, books: BookCandidate[], keys: string[]): Promise<Set<string>> {
  const known = new Set<string>();
  if (keys.length === 0) return known;
  const { data, error } = await db.from("books").select("dedup_key").in("dedup_key", keys);
  if (error) throw new Error(error.message);
  for (const row of data) known.add(row.dedup_key);
  const googleIds = books.map((b) => b.googleBooksId).filter((id): id is string => !!id);
  if (googleIds.length) {
    const { data: byGoogle } = await db.from("books").select("dedup_key, google_books_id").in("google_books_id", googleIds);
    for (const row of byGoogle ?? []) known.add(row.dedup_key);
  }
  return known;
}

async function enrichAndInsert(deps: PipelineDeps, book: MergedBook, categoryId: string): Promise<boolean> {
  let description = book.description;
  if ((!description || description.length < 80) && book.openLibraryId) {
    description = (await fetchOpenLibraryDescription(book.openLibraryId, deps.userAgent).catch(() => null)) ?? description;
  }
  let publicDomain = false;
  if (book.publishedYear !== null && book.publishedYear <= new Date().getUTCFullYear() - 96) {
    const death = await authorDeathYear(book.author, deps.userAgent).catch(() => null);
    publicDomain = isPublicDomain(book.publishedYear, death);
  }
  const { error } = await deps.db.from("books").insert({
    google_books_id: book.googleBooksId,
    open_library_id: book.openLibraryId,
    dedup_key: book.dedupKey,
    title: book.title.slice(0, 300),
    author: book.author.slice(0, 200),
    language: book.language,
    published_year: book.publishedYear,
    cover_url: book.coverUrl,
    description: description?.slice(0, 5000) ?? null,
    average_rating: book.averageRating,
    ratings_count: book.ratingsCount,
    info_link: book.infoLink,
    is_public_domain: publicDomain,
    popularity_score: book.popularityScore,
    source_category_id: categoryId,
  });
  if (error) {
    // Unique violations mean another source already brought this book in.
    if (error.code === "23505") return false;
    throw new Error(error.message);
  }
  return true;
}

/** Runs one discovery query against both catalogues and stores the best new books. */
export async function discoverQuery(
  deps: PipelineDeps,
  counters: RunCounters,
  query: { id: string; category_id: string; query_text: string },
): Promise<number> {
  const results = await Promise.allSettled([
    searchGoogleBooks(query.query_text, { apiKey: deps.googleApiKey, userAgent: deps.userAgent }),
    searchOpenLibrary(query.query_text, { userAgent: deps.userAgent }),
  ]);
  const candidates: BookCandidate[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") candidates.push(...r.value);
    else recordError(counters, `discovery:${i === 0 ? "google" : "openlibrary"}:${query.query_text}`, r.reason, deps.log);
  });

  const merged = selectBooks(candidates, new Set(), 50);
  const known = await knownBookKeys(deps.db, candidates, merged.map((b) => b.dedupKey));
  const fresh = merged.filter((b) => !known.has(b.dedupKey)).slice(0, NEW_BOOKS_PER_QUERY);

  let inserted = 0;
  for (const book of fresh) {
    try {
      if (await enrichAndInsert(deps, book, query.category_id)) inserted += 1;
    } catch (error) {
      recordError(counters, `book:${book.title}`, error, deps.log);
    }
  }
  await deps.db.from("ingestion_queries").update({ last_run_at: new Date().toISOString() }).eq("id", query.id);
  counters.booksFound += inserted;
  deps.log(`[discovery] "${query.query_text}": ${candidates.length} results, ${inserted} new books`);
  return inserted;
}

// ---------------------------------------------------------------------------
// Card generation for one book
// ---------------------------------------------------------------------------

async function recentSignatures(db: Db, categoryIds: string[], language: Language): Promise<StructureSignature[]> {
  const { data } = await db
    .from("card_translations")
    .select("story, body, cards!inner(category_id)")
    .in("cards.category_id", categoryIds)
    .neq("cards.source_type", "manual") // hand-written seed ideas do not set the bar for generated ones
    .eq("language", language)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((r) => structureSignature(language, r.story || r.body));
}

async function recentTitles(db: Db, categoryIds: string[]): Promise<string[]> {
  const { data } = await db
    .from("card_translations")
    .select("title, cards!inner(category_id)")
    .in("cards.category_id", categoryIds)
    .eq("language", "fr")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(40);
  return (data ?? []).map((r) => r.title);
}

async function isNearDuplicate(db: Db, embedding: string, language: Language): Promise<string | null> {
  const { data, error } = await db.rpc("match_cards", {
    query_embedding: embedding,
    match_language: language,
    match_threshold: DUPLICATE_SIMILARITY,
    match_count: 1,
  });
  if (error) throw new Error(`match_cards: ${error.message}`);
  return data[0]?.id ?? null;
}

type PreparedVersion = {
  version: LanguageVersion;
  quality: number;
  style: number;
  embedding: string;
  reasons: string[];
};

type PreparedCard = {
  difficulty: number;
  categoryId: string;
  fr: PreparedVersion;
  en: PreparedVersion;
};

/**
 * Stores one idea: the card (identity and scores) and its two translations.
 * Rejected ideas are kept too (with the reasons) for auditing. Returns
 * "published" only for an accepted idea; "rejected" otherwise, including when an
 * identical text already exists (unique content hash).
 */
export async function insertCardPair(
  deps: Pick<PipelineDeps, "db" | "publishMode" | "sourceType">,
  runId: string,
  book: { id: string; title: string },
  card: PreparedCard,
  accepted: boolean,
  quote: { text: string; author: string } | null,
): Promise<"published" | "draft" | "rejected"> {
  const { db } = deps;
  const status = accepted ? (deps.publishMode === "auto" ? "published" : "draft") : "rejected";
  const reasonText = LANGUAGES.map((l) => card[l].reasons.map((r) => `${l}:${r}`)).flat().join(", ").slice(0, 1000);

  const { data: row, error } = await db
    .from("cards")
    .insert({
      category_id: card.categoryId,
      book_id: book.id,
      difficulty: card.difficulty,
      status,
      quality_score: Math.min(card.fr.quality, card.en.quality),
      source_type: deps.sourceType,
      ingestion_run_id: runId,
      rejection_reason: accepted ? null : reasonText || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(`insert card: ${error.message}`);

  const translations = LANGUAGES.map((language) => {
    const v = card[language].version;
    return {
      card_id: row.id,
      language,
      title: v.title.trim().slice(0, 120),
      story: v.story.trim().slice(0, 1200),
      body: v.body.trim().slice(0, 900),
      action_step: v.action_step.trim().slice(0, 300),
      quote: accepted ? (quote?.text ?? null) : null,
      quote_author: accepted && quote ? `${quote.author}, ${book.title}` : null,
      style_score: card[language].style,
      status,
      content_hash: contentHash(language, v.title, `${v.story}\n${v.body}`),
      embedding: card[language].embedding,
      rejection_reason: accepted ? null : card[language].reasons.join(", ").slice(0, 1000) || null,
    };
  });
  const { error: translationError } = await db.from("card_translations").insert(translations);
  if (translationError) {
    // Without both translations the card is useless: remove it (23505 = identical text exists,
    // 23514 = a length check failed). Any other error is unexpected.
    await db.from("cards").delete().eq("id", row.id);
    if (translationError.code === "23505" || translationError.code === "23514") return "rejected";
    throw new Error(`insert translations: ${translationError.message}`);
  }
  return status === "rejected" ? "rejected" : status;
}

export type BookResult = { created: number; rejected: number };

export async function processBook(
  deps: PipelineDeps,
  counters: RunCounters,
  runId: string,
  book: BookRow,
  mainCategory: CategoryRow,
  subcategories: CategoryRow[],
  options: { minCards?: number; maxCards?: number } = {},
): Promise<BookResult> {
  const { db, model, log } = deps;
  const categoryIds = [mainCategory.id, ...subcategories.map((s) => s.id)];
  await db.from("books").update({ process_attempts: book.process_attempts + 1 }).eq("id", book.id);

  const subs = subcategories.length ? subcategories : [mainCategory];
  const batch = await model.generate({
    title: book.title,
    author: book.author,
    publishedYear: book.published_year,
    description: book.description,
    isPublicDomain: book.is_public_domain,
    categoryName: mainCategory.name_fr,
    subcategories: subs.map((s) => ({ slug: s.slug, name: s.name_fr })),
    minCards: options.minCards ?? 5,
    maxCards: options.maxCards ?? 10,
    avoidTitles: await recentTitles(db, categoryIds),
  });

  const result: BookResult = { created: 0, rejected: 0 };
  if (batch.cards.length === 0) {
    await db.from("books").update({ processed_at: new Date().toISOString() }).eq("id", book.id);
    log(`[book] "${book.title}": model produced no cards`);
    return result;
  }

  const rewritten = await model.rewrite(batch.cards.map((c) => ({ fr: c.fr, en: c.en })));
  const scores = await model.score(rewritten);

  // One verified quote at most per book, attached to the first accepted card in its language.
  let quote: { text: string; author: string; language: Language } | null = null;
  if (batch.quote && wordCount(batch.quote.text) < 15) {
    const verified = await quoteExistsOnWikiquote(batch.quote.text, batch.quote.language, deps.userAgent).catch(() => false);
    if (verified) quote = { text: batch.quote.text.trim(), author: batch.quote.author.trim(), language: batch.quote.language };
    else log(`[book] "${book.title}": quote not verifiable, dropped`);
  }

  const slugToId = new Map(subs.map((s) => [s.slug, s.id]));
  const texts = rewritten.flatMap((card) => LANGUAGES.map((language) => embeddingText(card[language])));
  const vectors = await deps.embed(texts);
  const signatures: Record<Language, StructureSignature[]> = {
    fr: await recentSignatures(db, categoryIds, "fr"),
    en: await recentSignatures(db, categoryIds, "en"),
  };
  let quoteUsed = false;

  for (const [index, card] of rewritten.entries()) {
    const generated = batch.cards[index]!;
    // The quote keeps its original language in BOTH versions (never re-translated).
    const cardQuote = quote && !quoteUsed ? quote : null;

    const versions = {} as Record<Language, PreparedVersion>;
    for (const [langIndex, language] of LANGUAGES.entries()) {
      const v = card[language];
      const score = scores.find((s) => s.index === index && s.language === language);
      const reasons: string[] = [];
      reasons.push(...checkQuality({ language, ...v, quote: cardQuote?.text, quote_author: cardQuote?.author }, book.description).reasons);
      reasons.push(...checkStyle({ language, ...v }, signatures[language]).reasons);
      const quality = score?.quality ?? 0;
      const style = score?.style ?? 0;
      if (quality < PUBLISH_THRESHOLD) reasons.push(`quality_score:${quality}`);
      if (style < PUBLISH_THRESHOLD) reasons.push(`style_score:${style}`);
      const embedding = toVectorLiteral(vectors[index * 2 + langIndex]!);
      if (reasons.length === 0) {
        const duplicateOf = await isNearDuplicate(db, embedding, language);
        if (duplicateOf) reasons.push(`near_duplicate:${duplicateOf}`);
      }
      versions[language] = { version: v, quality, style, embedding, reasons };
    }

    const prepared: PreparedCard = {
      difficulty: Math.min(3, Math.max(1, Math.round(generated.difficulty))),
      categoryId: slugToId.get(generated.subcategory_slug) ?? mainCategory.id,
      fr: versions.fr,
      en: versions.en,
    };
    // A card is published only when both versions pass every filter.
    const accepted = prepared.fr.reasons.length === 0 && prepared.en.reasons.length === 0;
    const outcome = await insertCardPair(deps, runId, book, prepared, accepted, cardQuote);
    if (outcome !== "rejected") {
      result.created += 1;
      if (cardQuote) quoteUsed = true;
      for (const language of LANGUAGES) signatures[language].unshift(structureSignature(language, card[language].story || card[language].body));
    } else {
      result.rejected += 1;
    }
  }

  await db.from("books").update({ processed_at: new Date().toISOString() }).eq("id", book.id);
  counters.cardsCreated += result.created;
  counters.cardsRejected += result.rejected;
  log(`[book] "${book.title}": ${result.created} published, ${result.rejected} rejected`);
  return result;
}

// ---------------------------------------------------------------------------
// Full run (cron / admin)
// ---------------------------------------------------------------------------

export type RunOptions = {
  source: "cron" | "admin" | "manual";
  categoryIds?: string[];
  maxBooks: number;
  queriesPerRun: number;
};

export type RunSummary = RunCounters & { runId: string; status: "success" | "partial" | "failed"; modelCalls: number };

export async function loadCategoryTree(db: Db) {
  const { data, error } = await db.from("categories").select("*").order("sort_order");
  if (error) throw new Error(error.message);
  const mains = data.filter((c) => c.parent_id === null);
  const childrenOf = (id: string) => data.filter((c) => c.parent_id === id);
  return { all: data, mains, childrenOf };
}

export async function runPipeline(deps: PipelineDeps, options: RunOptions): Promise<RunSummary> {
  const counters = newCounters();
  const runId = await startRun(deps.db, options.source, {
    categoryIds: options.categoryIds ?? null,
    maxBooks: options.maxBooks,
    budget: deps.model.callsUsed,
  });
  let status: RunSummary["status"] = "success";

  try {
    const tree = await loadCategoryTree(deps.db);
    const targetMains = options.categoryIds?.length
      ? tree.mains.filter((m) => options.categoryIds!.includes(m.id))
      : tree.mains;
    const targetIds = targetMains.map((m) => m.id);

    // 1. Discovery: the least recently used queries first.
    const { data: queries, error } = await deps.db
      .from("ingestion_queries")
      .select("id, category_id, query_text")
      .in("category_id", targetIds)
      .order("last_run_at", { ascending: true, nullsFirst: true })
      .limit(options.queriesPerRun);
    if (error) throw new Error(error.message);
    for (const query of queries) {
      if (Date.now() > deps.deadline) break;
      try {
        await discoverQuery(deps, counters, query);
      } catch (e) {
        recordError(counters, `query:${query.query_text}`, e, deps.log);
      }
    }

    // 2. Generation for the most popular unprocessed books.
    const { data: books, error: booksError } = await deps.db
      .from("books")
      .select("*")
      .is("processed_at", null)
      .lt("process_attempts", MAX_BOOK_ATTEMPTS)
      .in("source_category_id", targetIds)
      .order("popularity_score", { ascending: false })
      .limit(options.maxBooks);
    if (booksError) throw new Error(booksError.message);

    for (const book of books) {
      if (Date.now() > deps.deadline) {
        status = "partial";
        deps.log("[run] time budget reached");
        break;
      }
      const main = targetMains.find((m) => m.id === book.source_category_id);
      if (!main) continue;
      try {
        await processBook(deps, counters, runId, book, main, tree.childrenOf(main.id));
      } catch (e) {
        if (e instanceof BudgetExceededError) {
          status = "partial";
          deps.log("[run] model call budget reached");
          break;
        }
        recordError(counters, `book:${book.title}`, e, deps.log);
      }
    }
    if (counters.errors.length > 0 && status === "success") status = "partial";
  } catch (e) {
    status = "failed";
    recordError(counters, "run", e, deps.log);
  }

  await finishRun(deps.db, runId, counters, deps.model.callsUsed, status);
  return { ...counters, runId, status, modelCalls: deps.model.callsUsed };
}
