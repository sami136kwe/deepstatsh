/**
 * Database integration tests (RLS, RPC functions) against a running Supabase:
 *   npx supabase start && npm run seed:demo && npm run test:db
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "@/types/database";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
type Db = SupabaseClient<Database>;

const admin: Db = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });
const created: string[] = [];

async function signedInClient(label: string): Promise<{ db: Db; id: string }> {
  const email = `rls-${label}-${Date.now()}@example.com`;
  const password = "integration-test-pw";
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  created.push(data.user.id);
  const db = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await db.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { db, id: data.user.id };
}

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

let alice: { db: Db; id: string };
let bob: { db: Db; id: string };
let cardId: string;
let draftId: string;

beforeAll(async () => {
  alice = await signedInClient("alice");
  bob = await signedInClient("bob");
  const { data } = await admin.from("card_details").select("id, category_id").eq("status", "published").eq("language", "fr").limit(1).single();
  if (!data) throw new Error("run `npm run seed:demo` first");
  cardId = data.id;
  const { data: draft, error } = await admin.from("cards").insert({ category_id: data.category_id, status: "draft" }).select("id").single();
  if (error) throw error;
  draftId = draft.id;
  const { error: translationError } = await admin.from("card_translations").insert(
    (["fr", "en"] as const).map((language) => ({
      card_id: draftId,
      language,
      title: "Brouillon de test",
      body: "Ceci est une carte brouillon utilisée par les tests d'intégration. Elle ne doit jamais être visible.",
      action_step: "Ne rien faire du tout aujourd'hui.",
      status: "draft",
      content_hash: `test-draft-${language}-${Date.now()}`,
    })),
  );
  if (translationError) throw translationError;
});

afterAll(async () => {
  for (const id of created) await admin.auth.admin.deleteUser(id);
  if (draftId) await admin.from("cards").delete().eq("id", draftId);
});

describe("row level security", () => {
  it("creates a profile for each new user", async () => {
    const { data } = await alice.db.from("profiles").select("id, language, streak_count").single();
    expect(data).toMatchObject({ id: alice.id, streak_count: 0 });
  });

  it("only exposes published cards", async () => {
    const anon = createClient<Database>(url, anonKey, { auth: { persistSession: false } });
    const { data: published } = await anon.from("cards").select("id").eq("id", cardId);
    expect(published).toHaveLength(1);
    const { data: hidden } = await alice.db.from("cards").select("id").eq("id", draftId);
    expect(hidden).toHaveLength(0);
    const { data: hiddenText } = await alice.db.from("card_translations").select("id").eq("card_id", draftId);
    expect(hiddenText).toHaveLength(0);
    const { data: both } = await anon.from("card_translations").select("language").eq("card_id", cardId);
    expect(both!.map((t) => t.language).sort()).toEqual(["en", "fr"]);
  });

  it("forbids users from writing cards or books", async () => {
    const { error } = await alice.db.from("cards").update({ difficulty: 3 }).eq("id", cardId);
    expect(error).not.toBeNull();
    const { error: translationError } = await alice.db.from("card_translations").update({ title: "hacked" }).eq("card_id", cardId);
    expect(translationError).not.toBeNull();
    const { data: after } = await admin.from("card_translations").select("title").eq("card_id", cardId);
    expect(after!.every((t) => t.title !== "hacked")).toBe(true);
    const { error: bookError } = await alice.db.from("books").insert({ dedup_key: "x|y", title: "x", author: "y" });
    expect(bookError).not.toBeNull();
  });

  it("keeps stashes private to their owner", async () => {
    const { error } = await alice.db.from("stashes").insert({ user_id: alice.id, card_id: cardId, note: "secret" });
    expect(error).toBeNull();
    const { data: bobView } = await bob.db.from("stashes").select("*").eq("user_id", alice.id);
    expect(bobView).toHaveLength(0);
    const { error: forged } = await bob.db.from("stashes").insert({ user_id: alice.id, card_id: cardId });
    expect(forged).not.toBeNull();
  });

  it("does not let users edit their own streak directly", async () => {
    const { error } = await alice.db.from("profiles").update({ streak_count: 999 }).eq("id", alice.id);
    expect(error).not.toBeNull();
  });

  it("hides ingestion tables and the dedup function from users", async () => {
    const { data } = await alice.db.from("ingestion_runs").select("id");
    expect(data ?? []).toHaveLength(0);
    const { error } = await alice.db.rpc("match_cards", { query_embedding: `[${Array(384).fill(0).join(",")}]`, match_language: "fr" });
    expect(error).not.toBeNull();
  });
});

describe("reading history and decks", () => {
  it("records reads with counts, and keeps is_stashed in sync", async () => {
    await alice.db.from("card_views").insert({ user_id: alice.id, card_id: cardId, action: "seen" });
    await alice.db.from("card_views").insert({ user_id: alice.id, card_id: cardId, action: "skipped" });
    await alice.db.from("card_views").insert({ user_id: alice.id, card_id: cardId, action: "seen" });
    const { data } = await alice.db.from("user_card_state").select("*").eq("card_id", cardId).single();
    expect(data).toMatchObject({ user_id: alice.id, read_count: 2, is_stashed: true }); // alice stashed it above
    expect(new Date(data!.last_read_at).getTime()).toBeGreaterThanOrEqual(new Date(data!.first_read_at).getTime());

    await alice.db.from("stashes").delete().eq("card_id", cardId).eq("user_id", alice.id);
    const { data: unstashed } = await alice.db.from("user_card_state").select("is_stashed, read_count").eq("card_id", cardId).single();
    expect(unstashed).toEqual({ is_stashed: false, read_count: 2 });
  });

  it("keeps reading history private and read-only", async () => {
    const { data: bobView } = await bob.db.from("user_card_state").select("*").eq("user_id", alice.id);
    expect(bobView).toHaveLength(0);
    const { error } = await alice.db.from("user_card_state").update({ read_count: 99 }).eq("user_id", alice.id);
    expect(error).not.toBeNull();
    const { data } = await alice.db.from("user_card_state").select("read_count").eq("card_id", cardId).single();
    expect(data!.read_count).toBe(2);
  });

  it("lets a user store only their own deck and position", async () => {
    const own = await alice.db.from("daily_deck").insert({ user_id: alice.id, deck_date: today, card_id: cardId, position: 1 });
    expect(own.error).toBeNull();
    const duplicatePosition = await alice.db.from("daily_deck").insert({ user_id: alice.id, deck_date: today, card_id: draftId, position: 1 });
    expect(duplicatePosition.error).not.toBeNull();
    const forged = await bob.db.from("daily_deck").insert({ user_id: alice.id, deck_date: today, card_id: cardId, position: 2 });
    expect(forged.error).not.toBeNull();
    const state = await alice.db.from("daily_deck_state").upsert({ user_id: alice.id, deck_date: today, current_position: 7 });
    expect(state.error).toBeNull();
    const { data: bobDeck } = await bob.db.from("daily_deck").select("*").eq("user_id", alice.id);
    expect(bobDeck).toHaveLength(0);
  });

  it("accepts daily_limit and timezone only from the allowed set", async () => {
    const ok = await alice.db.from("profiles").update({ daily_limit: "50", timezone: "Europe/Paris" }).eq("id", alice.id);
    expect(ok.error).toBeNull();
    const bad = await alice.db.from("profiles").update({ daily_limit: "75" }).eq("id", alice.id);
    expect(bad.error).not.toBeNull();
    const { data } = await alice.db.from("profiles").select("daily_limit, timezone").single();
    expect(data).toEqual({ daily_limit: "50", timezone: "Europe/Paris" });
  });
});

describe("story format", () => {
  it("finds a card from a word that only appears in its story", async () => {
    // "concert" is in the French story of "Le coût déjà payé", not in its title, lesson or action.
    const { data } = await admin
      .from("card_translations")
      .select("title, story")
      .eq("language", "fr")
      .eq("status", "published")
      .textSearch("search", "concert", { type: "websearch", config: "french" });
    expect(data!.map((t) => t.title)).toContain("Le coût déjà payé");
    expect(data!.every((t) => !t.title.toLowerCase().includes("concert"))).toBe(true);
  });

  it("exposes the story through card_details, in the right language", async () => {
    const { data } = await admin.from("card_details").select("language, story, title").eq("title", "Pay yourself first").ilike("story", "%Hugo%");
    expect(data).toHaveLength(1);
    expect(data![0]!.language).toBe("en");
    expect(data![0]!.story).toContain("Hugo");
  });

  it("refuses a story that is too short, but still accepts a card without one (older cards)", async () => {
    const { data: card } = await admin.from("cards").insert({ category_id: (await admin.from("categories").select("id").limit(1).single()).data!.id, status: "draft" }).select("id").single();
    const base = { card_id: card!.id, language: "fr", title: "Titre de test", body: "Une leçon qui fait au moins quarante caractères de long.", action_step: "Fais quelque chose de précis aujourd'hui.", status: "draft" };
    const tooShort = await admin.from("card_translations").insert({ ...base, story: "Trop court.", content_hash: `short-${Date.now()}` });
    expect(tooShort.error).not.toBeNull();
    const noStory = await admin.from("card_translations").insert({ ...base, content_hash: `nostory-${Date.now()}` });
    expect(noStory.error).toBeNull();
    await admin.from("cards").delete().eq("id", card!.id);
  });
});

describe("re-reading", () => {
  let carol: { db: Db; id: string };
  let a: { id: string; main: string; title: string };
  let b: { id: string; main: string; title: string };

  beforeAll(async () => {
    carol = await signedInClient("carol");
    const { data } = await admin
      .from("card_details")
      .select("id, main_category_id, title")
      .eq("language", "fr")
      .eq("status", "published")
      .order("created_at");
    const first = data![0]!;
    const other = data!.find((c) => c.main_category_id !== first.main_category_id)!;
    a = { id: first.id, main: first.main_category_id!, title: first.title };
    b = { id: other.id, main: other.main_category_id!, title: other.title };
    await carol.db.from("card_views").insert({ user_id: carol.id, card_id: a.id, action: "seen" });
    await new Promise((r) => setTimeout(r, 20));
    await carol.db.from("card_views").insert({ user_id: carol.id, card_id: b.id, action: "seen" });
  });

  const ids = (rows: { card_id: string }[] | null) => (rows ?? []).map((r) => r.card_id);

  it("counts a re-read as a read without moving first_read_at", async () => {
    const before = await carol.db.from("user_card_state").select("first_read_at").eq("card_id", a.id).single();
    await new Promise((r) => setTimeout(r, 20));
    const { error } = await carol.db.from("card_views").insert({ user_id: carol.id, card_id: a.id, action: "reread" });
    expect(error).toBeNull();
    const { data } = await carol.db.from("user_card_state").select("first_read_at, last_read_at, read_count").eq("card_id", a.id).single();
    expect(data!.read_count).toBe(2);
    expect(data!.first_read_at).toBe(before.data!.first_read_at);
    expect(new Date(data!.last_read_at).getTime()).toBeGreaterThan(new Date(data!.first_read_at).getTime());
    const bad = await carol.db.from("card_views").insert({ user_id: carol.id, card_id: a.id, action: "bogus" });
    expect(bad.error).not.toBeNull();
  });

  it("picks cards to re-read by mode, category and exclusion", async () => {
    const call = (args: Record<string, unknown>) => carol.db.rpc("reread_candidates", { p_language: "fr", ...args });
    // a was re-read last, so b was read longest ago.
    expect(ids((await call({ p_mode: "oldest" })).data)).toEqual([b.id, a.id]);
    // b was read once, a twice.
    expect(ids((await call({ p_mode: "least" })).data)).toEqual([b.id, a.id]);
    expect(ids((await call({ p_mode: "random", p_category: a.main })).data)).toEqual([a.id]);
    expect(ids((await call({ p_mode: "random", p_exclude: [a.id] })).data)).toEqual([b.id]);
    expect(ids((await call({ p_mode: "stashed" })).data)).toEqual([]);
    await carol.db.from("stashes").insert({ user_id: carol.id, card_id: b.id });
    expect(ids((await call({ p_mode: "stashed" })).data)).toEqual([b.id]);
    expect(ids((await call({ p_mode: "random", p_limit: 1 })).data)).toHaveLength(1);
  });

  it("does not offer cards the user never read, nor other users' history", async () => {
    const { data } = await bob.db.rpc("reread_candidates", { p_language: "fr", p_mode: "random", p_limit: 100 });
    expect(ids(data)).not.toContain(b.id);
  });

  it("lists the history newest first with filters and full-text search", async () => {
    const call = (args: Record<string, unknown>) => carol.db.rpc("history_cards", { p_language: "fr", ...args });
    const all = await call({});
    expect(ids(all.data)).toEqual([a.id, b.id]); // a was read most recently
    expect(Number(all.data![0]!.total_count)).toBe(2);
    expect(ids((await call({ p_stashed: true })).data)).toEqual([b.id]);
    expect(ids((await call({ p_category: a.main })).data)).toEqual([a.id]);
    const word = b.title.split(/\s+/).sort((x, y) => y.length - x.length)[0]!;
    expect(ids((await call({ p_q: word })).data)).toContain(b.id);
    expect(ids((await call({ p_q: "zzzzzznotaword" })).data)).toEqual([]);
    const future = new Date(Date.now() + 3_600_000).toISOString();
    expect(ids((await call({ p_from: future })).data)).toEqual([]);
    expect(ids((await call({ p_to: new Date(Date.now() - 3_600_000).toISOString() })).data)).toEqual([]);
    expect(ids((await call({ p_limit: 1, p_offset: 1 })).data)).toEqual([b.id]);
  });
});

describe("books and ideas", () => {
  let bookId: string;
  let ideas: { id: string; position: number }[];

  beforeAll(async () => {
    const { data: book } = await admin.from("books").select("id").eq("slug", "the-power-of-now").single();
    if (!book) throw new Error("run `npm run seed:demo` first");
    bookId = book.id;
    const { data } = await admin.from("cards").select("id, position").eq("book_id", bookId).not("position", "is", null).order("position");
    ideas = (data ?? []).map((c) => ({ id: c.id, position: c.position! }));
  });

  it("exposes eight numbered ideas and a book overview in English", async () => {
    expect(ideas.map((i) => i.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const { data } = await alice.db.from("book_overview").select("idea_count, summary").eq("id", bookId).eq("language", "en").single();
    expect(data?.idea_count).toBe(8);
    expect(data?.summary).toBeTruthy();
    const { data: fr } = await alice.db.from("book_overview").select("idea_count").eq("id", bookId).eq("language", "fr").single();
    expect(fr?.idea_count).toBe(0);
  });

  it("refuses an idea whose earlier ideas are not done, then unlocks them in order", async () => {
    const locked = await alice.db.rpc("complete_idea", { p_card: ideas[2]!.id });
    expect(locked.error?.message).toMatch(/locked/);
    expect((await alice.db.rpc("complete_idea", { p_card: ideas[0]!.id })).error).toBeNull();
    expect((await alice.db.rpc("complete_idea", { p_card: ideas[1]!.id })).error).toBeNull();
    const third = await alice.db.rpc("complete_idea", { p_card: ideas[2]!.id });
    expect(third.error).toBeNull();
    expect(third.data?.[0]).toMatchObject({ r_done: 3, r_total: 8, r_completed: false });
    // Doing it twice changes nothing.
    const again = await alice.db.rpc("complete_idea", { p_card: ideas[2]!.id });
    expect(again.data?.[0]?.r_done).toBe(3);
  });

  it("marks the book completed after the last idea", async () => {
    let last;
    for (const idea of ideas) last = await alice.db.rpc("complete_idea", { p_card: idea.id });
    expect(last?.data?.[0]).toMatchObject({ r_done: 8, r_total: 8, r_completed: true });
    const { data } = await alice.db.from("user_books").select("completed_at").eq("book_id", bookId).single();
    expect(data?.completed_at).toBeTruthy();
  });

  it("keeps progress private and writable only through the functions", async () => {
    const { data } = await bob.db.from("user_idea_progress").select("card_id");
    expect(data).toEqual([]);
    const direct = await bob.db.from("user_idea_progress").insert({ user_id: bob.id, card_id: ideas[0]!.id, book_id: bookId });
    expect(direct.error).not.toBeNull();
    expect((await bob.db.rpc("complete_idea", { p_card: ideas[1]!.id })).error?.message).toMatch(/locked/);
  });

  it("saves and unsaves a book without starting it", async () => {
    expect((await bob.db.rpc("set_book_saved", { p_book: bookId, p_saved: true })).error).toBeNull();
    const { data } = await bob.db.from("user_books").select("is_saved, started_at").eq("book_id", bookId).single();
    expect(data).toEqual({ is_saved: true, started_at: null });
  });
});

describe("rpc functions", () => {
  it("counts streak days with record_activity", async () => {
    const first = await bob.db.rpc("record_activity", { p_day: yesterday });
    expect(first.data?.[0]?.streak_count).toBe(1);
    const again = await bob.db.rpc("record_activity", { p_day: yesterday });
    expect(again.data?.[0]?.streak_count).toBe(1);
    const next = await bob.db.rpc("record_activity", { p_day: today });
    expect(next.data?.[0]).toMatchObject({ streak_count: 2, longest_streak: 2 });
    const bad = await bob.db.rpc("record_activity", { p_day: "2020-01-01" });
    expect(bad.error).not.toBeNull();
  });

  it("excludes seen cards from feed candidates", async () => {
    const before = await bob.db.rpc("feed_candidates", { p_language: "fr", p_category_ids: [], p_include: true, p_limit: 100 });
    expect(before.data?.some((c) => c.id === cardId)).toBe(true);
    await bob.db.from("card_views").insert({ user_id: bob.id, card_id: cardId, action: "seen" });
    const after = await bob.db.rpc("feed_candidates", { p_language: "fr", p_category_ids: [], p_include: true, p_limit: 100 });
    expect(after.data?.some((c) => c.id === cardId)).toBe(false);
  });

  it("returns the same daily challenge all day", async () => {
    const a = await bob.db.rpc("daily_challenge", { p_day: today });
    const b = await bob.db.rpc("daily_challenge", { p_day: today });
    expect(a.data?.[0]?.id).toBeDefined();
    expect(a.data?.[0]?.id).toBe(b.data?.[0]?.id);
  });

  it("reports progress for the fourteen main categories", async () => {
    const { data, error } = await bob.db.rpc("category_progress");
    expect(error).toBeNull();
    expect(data).toHaveLength(14);
    expect(data!.reduce((s, r) => s + Number(r.seen), 0)).toBeGreaterThanOrEqual(1);
  });

  it("finds near-duplicate embeddings with match_cards (service role)", async () => {
    const v = Array.from({ length: 384 }, (_, i) => (i === 0 ? 1 : 0));
    await admin.from("card_translations").update({ embedding: `[${v.join(",")}]` }).eq("card_id", draftId).eq("language", "fr");
    const close = Array.from({ length: 384 }, (_, i) => (i === 0 ? 1 : i === 1 ? 0.1 : 0));
    const { data, error } = await admin.rpc("match_cards", { query_embedding: `[${close.join(",")}]`, match_language: "fr" });
    expect(error).toBeNull();
    expect(data?.[0]?.id).toBe(draftId);
    const far = Array.from({ length: 384 }, (_, i) => (i === 5 ? 1 : 0));
    const none = await admin.rpc("match_cards", { query_embedding: `[${far.join(",")}]`, match_language: "fr" });
    expect(none.data?.some((c) => c.id === draftId)).toBe(false);
  });
});
