import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { CallBudget } from "@/lib/ingestion/http";
import {
  generationSystemPrompt,
  generationUserPrompt,
  rewriteSystemPrompt,
  scoringSystemPrompt,
  type GenerationPromptInput,
} from "./prompts";

/**
 * The three model passes of the pipeline: generate cards for a book, rewrite
 * them in a human voice, then score quality and style. Every call goes through
 * a CallBudget so a run can never exceed its cost cap.
 */

export class ModelOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelOutputError";
  }
}

const languageVersion = z.object({
  title: z.string(),
  story: z.string(),
  body: z.string(),
  action_step: z.string(),
});
export type LanguageVersion = z.infer<typeof languageVersion>;

export function generationSchema(subcategorySlugs: [string, ...string[]]) {
  return z.object({
    cards: z.array(
      z.object({
        subcategory_slug: z.enum(subcategorySlugs),
        difficulty: z.number(),
        fr: languageVersion,
        en: languageVersion,
      }),
    ),
    quote: z
      .object({
        text: z.string(),
        author: z.string(),
        language: z.enum(["fr", "en"]),
      })
      .nullable(),
  });
}
export type GeneratedBatch = z.infer<ReturnType<typeof generationSchema>>;

const rewriteSchema = z.object({
  cards: z.array(z.object({ index: z.number(), fr: languageVersion, en: languageVersion })),
});

const scoreSchema = z.object({
  scores: z.array(
    z.object({
      index: z.number(),
      language: z.enum(["fr", "en"]),
      quality: z.number(),
      style: z.number(),
    }),
  ),
});
export type CardScore = z.infer<typeof scoreSchema>["scores"][number];

export type ModelConfig = {
  apiKey: string;
  model: string;
  /** Server-side refusal fallback ("default" routing) unless disabled. */
  fallbacks: boolean;
};

export class CardModel {
  private client: Anthropic;

  constructor(
    private readonly config: ModelConfig,
    private readonly budget: CallBudget,
  ) {
    this.client = new Anthropic({ apiKey: config.apiKey, maxRetries: 4, timeout: 180_000 });
  }

  get callsUsed(): number {
    return this.budget.count;
  }

  private async call<S extends z.ZodType>(
    schema: S,
    system: string,
    user: string,
    effort: "low" | "medium" | "high",
  ): Promise<z.infer<S>> {
    this.budget.take();
    const response = await this.client.beta.messages.parse({
      model: this.config.model,
      max_tokens: 16000,
      ...(this.config.fallbacks
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
      system,
      messages: [{ role: "user", content: user }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
    });
    if (response.stop_reason === "refusal") {
      throw new ModelOutputError(`model declined (${response.stop_details?.category ?? "unknown"})`);
    }
    if (response.stop_reason === "max_tokens") {
      throw new ModelOutputError("model output truncated (max_tokens)");
    }
    if (response.parsed_output == null) {
      throw new ModelOutputError("model output did not match the expected schema");
    }
    return response.parsed_output as z.infer<S>;
  }

  async generate(input: GenerationPromptInput): Promise<GeneratedBatch> {
    const slugs = input.subcategories.map((s) => s.slug);
    if (slugs.length === 0) throw new Error("at least one subcategory is required");
    const schema = generationSchema(slugs as [string, ...string[]]);
    return this.call(schema, generationSystemPrompt(), generationUserPrompt(input), "medium");
  }

  async rewrite(cards: { fr: LanguageVersion; en: LanguageVersion }[]): Promise<{ fr: LanguageVersion; en: LanguageVersion }[]> {
    const payload = JSON.stringify(cards.map((c, index) => ({ index, ...c })), null, 1);
    const out = await this.call(
      rewriteSchema,
      rewriteSystemPrompt(),
      `Voici les cartes à réécrire (garde le même index) :\n${payload}`,
      "medium",
    );
    // Keep the original card when the rewrite skipped one.
    return cards.map((original, index) => {
      const rewritten = out.cards.find((c) => c.index === index);
      return rewritten ? { fr: rewritten.fr, en: rewritten.en } : original;
    });
  }

  async score(cards: { fr: LanguageVersion; en: LanguageVersion }[]): Promise<CardScore[]> {
    const payload = JSON.stringify(cards.map((c, index) => ({ index, ...c })), null, 1);
    const out = await this.call(
      scoreSchema,
      scoringSystemPrompt(),
      `Note chaque carte, en français (fr) et en anglais (en) séparément :\n${payload}`,
      "low",
    );
    return out.scores.map((s) => ({
      ...s,
      quality: Math.min(10, Math.max(1, Math.round(s.quality))),
      style: Math.min(10, Math.max(1, Math.round(s.style))),
    }));
  }
}
