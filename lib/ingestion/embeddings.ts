import { z } from "zod";
import { fetchJson } from "./http";

export const EMBEDDING_DIMENSIONS = 384;

const responseSchema = z.object({ embeddings: z.array(z.array(z.number()).length(EMBEDDING_DIMENSIONS)) });

export type Embedder = (texts: string[]) => Promise<number[][]>;

/** Embeddings from the `embed` Supabase Edge Function (gte-small, free). */
export function edgeFunctionEmbedder(url: string, secret: string, userAgent: string): Embedder {
  return async (texts) => {
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += 16) {
      const chunk = texts.slice(i, i + 16);
      const data = responseSchema.parse(
        await fetchJson(url, {
          method: "POST",
          userAgent,
          body: JSON.stringify({ texts: chunk }),
          headers: { "Content-Type": "application/json", "x-embed-secret": secret },
          timeoutMs: 60_000,
        }),
      );
      if (data.embeddings.length !== chunk.length) throw new Error("embedding count mismatch");
      out.push(...data.embeddings);
    }
    return out;
  };
}

/** pgvector literal for PostgREST. */
export function toVectorLiteral(vector: number[]): string {
  return `[${vector.map((v) => Number(v.toFixed(6))).join(",")}]`;
}

export function embeddingText(card: { title: string; body: string; action_step: string }): string {
  return `${card.title}\n${card.body}\n${card.action_step}`;
}
