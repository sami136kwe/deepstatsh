/**
 * Runs the daily ingestion pipeline once from the command line:
 *   npm run ingest                      all categories
 *   npm run ingest -- --category=<slug> one main category
 */
import { serverEnv } from "@/lib/env";
import { createPipelineDeps } from "@/lib/ingestion/deps";
import { loadCategoryTree, runPipeline } from "@/lib/ingestion/pipeline";
import { argValue, createServiceClient } from "./lib";

async function main() {
  const db = createServiceClient();
  const env = serverEnv();
  const slug = argValue("category");
  let categoryIds: string[] | undefined;
  if (slug) {
    const tree = await loadCategoryTree(db);
    const main = tree.mains.find((m) => m.slug === slug);
    if (!main) throw new Error(`unknown category: ${slug}`);
    categoryIds = [main.id];
  }
  const deps = createPipelineDeps(db, env, {
    maxModelCalls: env.INGEST_MAX_MODEL_CALLS,
    timeBudgetSeconds: env.INGEST_TIME_BUDGET_SECONDS,
    sourceType: "pipeline",
  });
  const summary = await runPipeline(deps, {
    source: "manual",
    categoryIds,
    maxBooks: env.INGEST_MAX_BOOKS_PER_RUN,
    queriesPerRun: env.INGEST_QUERIES_PER_RUN,
  });
  console.log(JSON.stringify({ ...summary, errors: summary.errors.length }, null, 2));
  if (summary.status === "failed") process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
