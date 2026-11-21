import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type MainCategory = Pick<
  Database["public"]["Tables"]["categories"]["Row"],
  "id" | "slug" | "name_fr" | "name_en" | "icon" | "description" | "description_en"
>;

export async function mainCategories(db: SupabaseClient<Database>): Promise<MainCategory[]> {
  const { data, error } = await db
    .from("categories")
    .select("id, slug, name_fr, name_en, icon, description, description_en")
    .is("parent_id", null)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data;
}
