/**
 * Pipeline integration test against the local database. The model, the
 * embedder and the external HTTP APIs are replaced by deterministic fakes, so
 * this checks discovery -> generation -> rule checks -> dedup -> publication
 * -> run logging without network access or API costs.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { CardModel, GeneratedBatch, LanguageVersion } from "@/lib/ai/cards";
import { CallBudget } from "@/lib/ingestion/http";
import { loadCategoryTree, newCounters, processBook, runPipeline, startRun, type PipelineDeps } from "@/lib/ingestion/pipeline";
import type { Database } from "@/types/database";

config({ path: ".env.local" });

const db = createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
});
const tag = Date.now().toString(36);
const realFetch = globalThis.fetch;
const supabaseOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).origin;

/** Stubs fetch for external APIs while letting Supabase requests through. */
function stubExternalFetch(handler: (url: string) => Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.startsWith(supabaseOrigin)) return realFetch(input, init);
      return handler(url);
    }),
  );
}

const GOOD: { fr: LanguageVersion; en: LanguageVersion } = {
  fr: {
    title: `L'effet projecteur ${tag}`,
    body: "Tu as renversé ton café en réunion et tu y penses encore le soir ? Les autres ont oublié au bout de cinq minutes. On surestime beaucoup à quel point les gens remarquent nos petits ratés, parce que chacun est occupé à se regarder lui-même. Ça devrait te rendre un peu plus léger.",
    action_step: "La prochaine fois que tu rumines une gaffe, demande à un proche s'il s'en souvient. Tu verras.",
  },
  en: {
    title: `The spotlight effect ${tag}`,
    body: "Spilled coffee in a meeting and still thinking about it at night? Everyone else forgot within five minutes. We hugely overestimate how much people notice our small slips, because everyone is busy watching themselves. That should make you feel a bit lighter.",
    action_step: "Next time you replay a blunder in your head, ask a friend if they even remember it.",
  },
};

const BAD: { fr: LanguageVersion; en: LanguageVersion } = {
  fr: {
    title: `La gestion des émotions ${tag}`,
    body: "La gestion des émotions est une compétence essentielle. Il est important de noter que les émotions influencent nos décisions au quotidien de manière significative.",
    action_step: "Prenez conscience de vos émotions.",
  },
  en: {
    title: `Managing emotions ${tag}`,
    body: "Managing emotions is an essential skill. Moreover, it is important to note that emotions influence our daily decisions in significant ways.",
    action_step: "Become aware of your emotions.",
  },
};

function fakeModel(cards: { fr: LanguageVersion; en: LanguageVersion }[], slug: string, budget = new CallBudget(100)) {
  const batch: GeneratedBatch = {
    cards: cards.map((c) => ({ subcategory_slug: slug, difficulty: 2, ...c })),
    quote: null,
  };
  const model = {
    get callsUsed() {
      return budget.count;
    },
    generate: vi.fn(async () => (budget.take(), batch)),
    rewrite: vi.fn(async (input: { fr: LanguageVersion; en: LanguageVersion }[]) => (budget.take(), input)),
    score: vi.fn(async (input: unknown[]) => {
      budget.take();
      return input.flatMap((_, index) => [
        { index, language: "fr" as const, quality: 8, style: 8 },
        { index, language: "en" as const, quality: 8, style: 8 },
      ]);
    }),
  };
  return model as unknown as CardModel & typeof model;
}

/** Each distinct text gets its own random unit vector; identical texts share one. */
function fakeEmbedder(fixed?: number[]) {
  const cache = new Map<string, number[]>();
  return async (texts: string[]) =>
    texts.map((t) => {
      if (fixed) return fixed;
      if (!cache.has(t)) {
        const v = Array.from({ length: 384 }, () => Math.random() - 0.5);
        const norm = Math.hypot(...v);
        cache.set(t, v.map((x) => x / norm));
      }
      return cache.get(t)!;
    });
}

let psychology: Database["public"]["Tables"]["categories"]["Row"];
let subs: Database["public"]["Tables"]["categories"]["Row"][];
const runIds: string[] = [];

function deps(model: CardModel, embed: PipelineDeps["embed"]): PipelineDeps {
  return {
    db,
    model,
    embed,
    userAgent: "StashTest/1.0",
    publishMode: "auto",
    sourceType: "pipeline",
    deadline: Date.now() + 60_000,
    log: () => {},
  };
}

async function insertBook(title: string) {
  const { data, error } = await db
    .from("books")
    .insert({
      dedup_key: `${title.toLowerCase()}|tester`,
      title,
      author: "Ada Tester",
      description: "A book about how people perceive each other.",
      popularity_score: 1,
      source_category_id: psychology.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

beforeAll(async () => {
  const tree = await loadCategoryTree(db);
  psychology = tree.mains.find((m) => m.slug === "psychologie")!;
  subs = tree.childrenOf(psychology.id);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await db.from("cards").delete().like("title", `%${tag}%`);
  await db.from("books").delete().eq("author", "Ada Tester");
  for (const id of runIds) await db.from("ingestion_runs").delete().eq("id", id);
});

describe("processBook", () => {
  it("publishes good cards in both languages and rejects bad ones with reasons", async () => {
    const book = await insertBook(`Perception ${tag}`);
    const model = fakeModel([GOOD, BAD], "biais-cognitifs");
    const runId = await startRun(db, "manual", { test: true });
    runIds.push(runId);
    const counters = newCounters();

    const result = await processBook(deps(model, fakeEmbedder()), counters, runId, book, psychology, subs);
    expect(result).toEqual({ created: 2, rejected: 2 });
    expect(model.generate).toHaveBeenCalledOnce();
    expect(model.rewrite).toHaveBeenCalledOnce();
    expect(model.score).toHaveBeenCalledOnce();

    const { data: cards } = await db.from("cards").select("title, status, language, rejection_reason, style_score, category_id").eq("book_id", book.id);
    const published = cards!.filter((c) => c.status === "published");
    expect(published.map((c) => c.language).sort()).toEqual(["en", "fr"]);
    expect(published.every((c) => Number(c.style_score) === 8)).toBe(true);
    expect(published[0]!.category_id).toBe(subs.find((s) => s.slug === "biais-cognitifs")!.id);

    const rejected = cards!.filter((c) => c.status === "rejected");
    expect(rejected).toHaveLength(2);
    expect(rejected.every((c) => /banned_(phrase|word)/.test(c.rejection_reason ?? ""))).toBe(true);

    const { data: updated } = await db.from("books").select("processed_at").eq("id", book.id).single();
    expect(updated!.processed_at).not.toBeNull();
  });

  it("rejects a near-duplicate (cosine > 0.92) of an existing card", async () => {
    const vector = Array.from({ length: 384 }, (_, i) => (i === 7 ? 1 : 0));
    const first = await insertBook(`Dup one ${tag}`);
    const second = await insertBook(`Dup two ${tag}`);
    const runId = await startRun(db, "manual", { test: true });
    runIds.push(runId);

    const variant = {
      fr: { ...GOOD.fr, title: `Le projecteur imaginaire ${tag}`, body: GOOD.fr.body.replace("cinq minutes", "dix minutes") },
      en: { ...GOOD.en, title: `The imaginary spotlight ${tag}`, body: GOOD.en.body.replace("five minutes", "ten minutes") },
    };
    const a = await processBook(deps(fakeModel([{ ...variant, fr: { ...variant.fr, title: `A ${variant.fr.title}` }, en: { ...variant.en, title: `A ${variant.en.title}` } }], "biais-cognitifs"), fakeEmbedder(vector)), newCounters(), runId, first, psychology, subs);
    expect(a.created).toBe(2);

    const b = await processBook(deps(fakeModel([variant], "biais-cognitifs"), fakeEmbedder(vector)), newCounters(), runId, second, psychology, subs);
    expect(b).toEqual({ created: 0, rejected: 2 });
    const { data } = await db.from("cards").select("rejection_reason").eq("book_id", second.id);
    expect(data!.every((c) => c.rejection_reason?.startsWith("near_duplicate:"))).toBe(true);
  });
});

describe("runPipeline", () => {
  it("discovers books, generates cards and logs the run", async () => {
    const title = `Mind Games ${tag}`;
    // Fake Google Books and Open Library responses for every discovery query.
    stubExternalFetch((url) => {
        if (url.includes("googleapis.com")) {
          return Response.json({
            items: [
              {
                id: `g-${tag}`,
                volumeInfo: { title, authors: ["Ada Tester"], publishedDate: "2015", description: "How we misread ourselves.", averageRating: 4.5, ratingsCount: 900, printType: "BOOK" },
              },
            ],
          });
        }
        if (url.includes("openlibrary.org/search")) return Response.json({ docs: [] });
        return new Response("not found", { status: 404 });
    });
    const budget = new CallBudget(3);
    const model = fakeModel([{ fr: { ...GOOD.fr, title: `Run ${GOOD.fr.title}` }, en: { ...GOOD.en, title: `Run ${GOOD.en.title}` } }], "biais-cognitifs", budget);
    const summary = await runPipeline(deps(model, fakeEmbedder()), {
      source: "manual",
      categoryIds: [psychology.id],
      maxBooks: 1,
      queriesPerRun: 1,
    });
    runIds.push(summary.runId);
    vi.unstubAllGlobals();

    expect(summary.booksFound).toBe(1);
    expect(summary.cardsCreated).toBe(2);
    expect(summary.modelCalls).toBe(3);
    const { data: run } = await db.from("ingestion_runs").select("*").eq("id", summary.runId).single();
    expect(run).toMatchObject({ source: "manual", books_found: 1, cards_created: 2, model_calls: 3 });
    expect(run!.finished_at).not.toBeNull();
    expect(["success", "partial"]).toContain(run!.status);
  });

  it("stops cleanly when the model call budget is exhausted", async () => {
    await insertBook(`Budget ${tag}`);
    stubExternalFetch(() => Response.json({ items: [], docs: [] }));
    const model = fakeModel([GOOD], "biais-cognitifs", new CallBudget(0));
    const summary = await runPipeline(deps(model, fakeEmbedder()), {
      source: "manual",
      categoryIds: [psychology.id],
      maxBooks: 1,
      queriesPerRun: 1,
    });
    vi.unstubAllGlobals();
    runIds.push(summary.runId);
    expect(summary.status).toBe("partial");
    expect(summary.cardsCreated).toBe(0);
  });
});
