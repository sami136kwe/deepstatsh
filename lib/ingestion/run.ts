import "server-only";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPipelineDeps } from "./deps";
import { runPipeline, type RunSummary } from "./pipeline";

/** Runs the pipeline from a route handler (cron or admin), within the function time limit. */
export async function runIngestion(source: "cron" | "admin", categoryIds?: string[]): Promise<RunSummary> {
  const env = serverEnv();
  const deps = createPipelineDeps(createAdminClient(), env, {
    maxModelCalls: env.INGEST_MAX_MODEL_CALLS,
    timeBudgetSeconds: env.INGEST_TIME_BUDGET_SECONDS,
    sourceType: "pipeline",
    log: (m) => console.log(`[ingest:${source}] ${m}`),
  });
  return runPipeline(deps, {
    source,
    categoryIds,
    maxBooks: categoryIds?.length ? Math.max(2, Math.ceil(env.INGEST_MAX_BOOKS_PER_RUN / 2)) : env.INGEST_MAX_BOOKS_PER_RUN,
    queriesPerRun: categoryIds?.length ? 2 : env.INGEST_QUERIES_PER_RUN,
  });
}
