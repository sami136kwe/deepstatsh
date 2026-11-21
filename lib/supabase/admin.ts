import "server-only";
import { createClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/** Service-role client: bypasses RLS. Server-only (route handlers, cron, admin). */
export function createAdminClient() {
  const env = serverEnv();
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
