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
  const { data } = await admin.from("cards").select("id, category_id").eq("status", "published").eq("language", "fr").limit(1).single();
  if (!data) throw new Error("run `npm run seed:demo` first");
  cardId = data.id;
  const { data: draft, error } = await admin
    .from("cards")
    .insert({
      category_id: data.category_id,
      title: "Brouillon de test",
      body: "Ceci est une carte brouillon utilisée par les tests d'intégration. Elle ne doit jamais être visible.",
      action_step: "Ne rien faire du tout aujourd'hui.",
      language: "fr",
      status: "draft",
      content_hash: `test-draft-${Date.now()}`,
    })
    .select("id")
    .single();
  if (error) throw error;
  draftId = draft.id;
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
  });

  it("forbids users from writing cards or books", async () => {
    const { error } = await alice.db.from("cards").update({ title: "hacked" }).eq("id", cardId);
    expect(error).not.toBeNull();
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

  it("reports progress for the twelve main categories", async () => {
    const { data, error } = await bob.db.rpc("category_progress");
    expect(error).toBeNull();
    expect(data).toHaveLength(12);
    expect(data!.reduce((s, r) => s + Number(r.seen), 0)).toBeGreaterThanOrEqual(1);
  });

  it("finds near-duplicate embeddings with match_cards (service role)", async () => {
    const v = Array.from({ length: 384 }, (_, i) => (i === 0 ? 1 : 0));
    await admin.from("cards").update({ embedding: `[${v.join(",")}]` }).eq("id", draftId);
    const close = Array.from({ length: 384 }, (_, i) => (i === 0 ? 1 : i === 1 ? 0.1 : 0));
    const { data, error } = await admin.rpc("match_cards", { query_embedding: `[${close.join(",")}]`, match_language: "fr" });
    expect(error).toBeNull();
    expect(data?.[0]?.id).toBe(draftId);
    const far = Array.from({ length: 384 }, (_, i) => (i === 5 ? 1 : 0));
    const none = await admin.rpc("match_cards", { query_embedding: `[${far.join(",")}]`, match_language: "fr" });
    expect(none.data?.some((c) => c.id === draftId)).toBe(false);
  });
});
