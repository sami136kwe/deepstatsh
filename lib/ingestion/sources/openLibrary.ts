import { z } from "zod";
import { fetchJson } from "../http";
import type { BookCandidate } from "./types";

const docSchema = z.object({
  key: z.string(),
  title: z.string(),
  author_name: z.array(z.string()).optional(),
  first_publish_year: z.number().optional(),
  ratings_average: z.number().optional(),
  ratings_count: z.number().optional(),
  cover_i: z.number().optional(),
  language: z.array(z.string()).optional(),
});

const searchSchema = z.object({ docs: z.array(z.unknown()) });

const workSchema = z.object({
  description: z.union([z.string(), z.object({ value: z.string() })]).optional(),
});

const OL_LANG: Record<string, string> = { eng: "en", fre: "fr", fra: "fr" };

export function parseOpenLibraryDoc(raw: unknown): BookCandidate | null {
  const parsed = docSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.author_name?.length) return null;
  const d = parsed.data;
  const lang = d.language?.map((l) => OL_LANG[l]).find(Boolean) ?? null;
  return {
    source: "openlibrary",
    googleBooksId: null,
    openLibraryId: d.key.replace("/works/", ""),
    title: d.title.trim(),
    author: d.author_name!.slice(0, 2).join(", "),
    language: lang,
    publishedYear: d.first_publish_year ?? null,
    coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
    description: null,
    averageRating: d.ratings_average ?? null,
    ratingsCount: d.ratings_count ?? 0,
    infoLink: `https://openlibrary.org${d.key}`,
  };
}

export async function searchOpenLibrary(
  query: string,
  opts: { userAgent: string; limit?: number },
): Promise<BookCandidate[]> {
  const params = new URLSearchParams({
    q: query,
    fields: "key,title,author_name,first_publish_year,ratings_average,ratings_count,cover_i,language",
    limit: String(opts.limit ?? 40),
  });
  const data = searchSchema.parse(
    await fetchJson(`https://openlibrary.org/search.json?${params}`, { userAgent: opts.userAgent }),
  );
  return data.docs.map(parseOpenLibraryDoc).filter((b): b is BookCandidate => b !== null);
}

export async function fetchOpenLibraryDescription(workId: string, userAgent: string): Promise<string | null> {
  const data = workSchema.safeParse(
    await fetchJson(`https://openlibrary.org/works/${encodeURIComponent(workId)}.json`, { userAgent }),
  );
  if (!data.success || !data.data.description) return null;
  const d = data.data.description;
  return (typeof d === "string" ? d : d.value).trim() || null;
}
