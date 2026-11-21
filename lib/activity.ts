import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** Updates the user's streak for their local day. Failures never block the main action. */
export async function recordActivity(db: SupabaseClient<Database>, day: string) {
  const { data, error } = await db.rpc("record_activity", { p_day: day });
  if (error) {
    console.error("[activity] record_activity failed:", error.message);
    return null;
  }
  return data[0] ?? null;
}

/** Only new cards and challenges count towards the streak: re-reading is a bonus. */
export function countsForStreak(action: "seen" | "skipped" | "completed" | "reread"): boolean {
  return action !== "reread";
}
