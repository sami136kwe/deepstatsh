import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CATEGORY_SEED } from "@/supabase/seed/categories";

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
