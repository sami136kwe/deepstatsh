import { CardModel } from "@/lib/ai/cards";
import type { ServerEnv } from "@/lib/env";
import { edgeFunctionEmbedder } from "./embeddings";
import { CallBudget } from "./http";
import type { Db, PipelineDeps } from "./pipeline";

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

/** Builds pipeline dependencies from validated environment variables. */
export function createPipelineDeps(
  db: Db,
  env: ServerEnv,
  options: { maxModelCalls: number; timeBudgetSeconds: number; sourceType: "seed" | "pipeline"; log?: (m: string) => void },
): PipelineDeps {
  if (!env.ANTHROPIC_API_KEY) throw new ConfigurationError("ANTHROPIC_API_KEY is not set");
  if (!env.EMBEDDING_FUNCTION_SECRET) throw new ConfigurationError("EMBEDDING_FUNCTION_SECRET is not set");
  const embedUrl = env.EMBEDDING_FUNCTION_URL ?? `${env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/embed`;
  const budget = new CallBudget(options.maxModelCalls);
  return {
    db,
    model: new CardModel(
      { apiKey: env.ANTHROPIC_API_KEY, model: env.ANTHROPIC_MODEL, fallbacks: env.ANTHROPIC_FALLBACKS === "default" },
      budget,
    ),
    embed: edgeFunctionEmbedder(embedUrl, env.EMBEDDING_FUNCTION_SECRET, env.INGEST_USER_AGENT),
    userAgent: env.INGEST_USER_AGENT,
    googleApiKey: env.GOOGLE_BOOKS_API_KEY,
    publishMode: env.INGEST_PUBLISH_MODE,
    sourceType: options.sourceType,
    deadline: Date.now() + options.timeBudgetSeconds * 1000,
    log: options.log ?? ((m) => console.log(m)),
  };
}
