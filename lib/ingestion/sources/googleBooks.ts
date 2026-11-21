import { z } from "zod";
import { fetchJson } from "../http";
import type { BookCandidate } from "./types";

const volumeSchema = z.object({
  id: z.string(),
  volumeInfo: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    authors: z.array(z.string()).optional(),
    language: z.string().optional(),
    publishedDate: z.string().optional(),
    description: z.string().optional(),
    averageRating: z.number().optional(),
    ratingsCount: z.number().optional(),
    infoLink: z.string().optional(),
    canonicalVolumeLink: z.string().optional(),
    printType: z.string().optional(),
    imageLinks: z.object({ thumbnail: z.string().optional(), smallThumbnail: z.string().optional() }).optional(),
  }),
});

const responseSchema = z.object({
  totalItems: z.number().optional(),
  items: z.array(z.unknown()).optional(),
});

export function stripHtml(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+\n/g, "\n")
    .trim();
}

export function parseGoogleVolume(raw: unknown): BookCandidate | null {
  const parsed = volumeSchema.safeParse(raw);
  if (!parsed.success) return null;
  const { id, volumeInfo: v } = parsed.data;
  if (!v.authors?.length || (v.printType && v.printType !== "BOOK")) return null;
  const year = v.publishedDate ? Number.parseInt(v.publishedDate.slice(0, 4), 10) : NaN;
  const thumb = v.imageLinks?.thumbnail ?? v.imageLinks?.smallThumbnail ?? null;
  return {
    source: "google",
    googleBooksId: id,
    openLibraryId: null,
    title: v.title.trim(),
    author: v.authors.slice(0, 2).join(", "),
    language: v.language ?? null,
    publishedYear: Number.isFinite(year) ? year : null,
    coverUrl: thumb ? thumb.replace(/^http:/, "https:") : null,
    description: v.description ? stripHtml(v.description) : null,
    averageRating: v.averageRating ?? null,
    ratingsCount: v.ratingsCount ?? 0,
    infoLink: (v.canonicalVolumeLink ?? v.infoLink ?? `https://books.google.com/books?id=${id}`).replace(/^http:/, "https:"),
  };
}

export async function searchGoogleBooks(
  query: string,
  opts: { apiKey?: string; userAgent: string; langRestrict?: string; maxResults?: number },
): Promise<BookCandidate[]> {
  const params = new URLSearchParams({
    q: query,
    printType: "books",
    orderBy: "relevance",
    maxResults: String(opts.maxResults ?? 40),
  });
  if (opts.langRestrict) params.set("langRestrict", opts.langRestrict);
  if (opts.apiKey) params.set("key", opts.apiKey);
  const data = responseSchema.parse(
    await fetchJson(`https://www.googleapis.com/books/v1/volumes?${params}`, { userAgent: opts.userAgent }),
  );
  return (data.items ?? []).map(parseGoogleVolume).filter((b): b is BookCandidate => b !== null);
}
