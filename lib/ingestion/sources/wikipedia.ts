import { z } from "zod";
import { fetchJson, HttpError } from "../http";

const summarySchema = z.object({
  type: z.string().optional(),
  description: z.string().optional(),
  extract: z.string().optional(),
});

const searchSchema = z.object({
  query: z.object({ searchinfo: z.object({ totalhits: z.number() }) }).optional(),
});

/** Extracts "(121–180)" style lifespans, including "AD" / "BC" / "c." variants. */
export function parseLifespan(text: string): { birth: number | null; death: number | null } | null {
  const m = text.match(/\(?(?:c\.\s*|born\s+)?(\d{1,4})\s*(BC|BCE|av\.? J\.-C\.)?\s*[–-]\s*(?:c\.\s*)?(\d{1,4})\s*(BC|BCE|AD|av\.? J\.-C\.)?\)?/i);
  if (!m) return null;
  const sign = (era?: string) => (era && /BC|av/i.test(era) ? -1 : 1);
  const birth = Number(m[1]) * sign(m[2] ?? m[4]);
  const death = Number(m[3]) * sign(m[4]);
  if (!Number.isFinite(death)) return null;
  return { birth: Number.isFinite(birth) ? birth : null, death };
}

/** Looks up the author on Wikipedia and returns their death year when known. */
export async function authorDeathYear(author: string, userAgent: string): Promise<number | null> {
  const primary = author.split(",")[0]!.trim();
  try {
    const data = summarySchema.parse(
      await fetchJson(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(primary.replace(/ /g, "_"))}`,
        { userAgent, retries: 1 },
      ),
    );
    if (data.type === "disambiguation") return null;
    const span = parseLifespan(`${data.description ?? ""} ${data.extract?.slice(0, 300) ?? ""}`);
    return span?.death ?? null;
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}

/**
 * Checks that a short quote appears verbatim on Wikiquote (exact phrase search).
 * Used to make sure every quote shown in the app is real and attributable.
 */
export async function quoteExistsOnWikiquote(quote: string, language: "fr" | "en", userAgent: string): Promise<boolean> {
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: `"${quote.replace(/["«»“”]/g, "").trim()}"`,
    srlimit: "1",
    format: "json",
    origin: "*",
  });
  const data = searchSchema.parse(
    await fetchJson(`https://${language}.wikiquote.org/w/api.php?${params}`, { userAgent, retries: 1 }),
  );
  return (data.query?.searchinfo.totalhits ?? 0) > 0;
}
