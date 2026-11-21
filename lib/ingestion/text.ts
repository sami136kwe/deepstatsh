import { createHash } from "node:crypto";

/** Lowercase, strip accents and punctuation, collapse spaces. */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’`]/g, "'")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Words used for overlap comparisons (accent-free, lowercase). */
export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized ? normalized.split(" ") : [];
}

/** Raw word count of a string (keeps the original spelling). */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Split prose into sentences. Handles ".", "!", "?" and "…" followed by a
 * space or the end of the text, and keeps quoted dialogue inside its sentence.
 */
export function splitSentences(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const parts = cleaned.match(/[^.!?…]+(?:[.!?…]+(?:\s?["'»”)])*|$)/g) ?? [cleaned];
  return parts.map((s) => s.trim()).filter((s) => /\p{L}/u.test(s));
}

/** Stable hash used for exact deduplication of cards. */
export function contentHash(language: string, title: string, body: string): string {
  return createHash("sha256")
    .update(`${language}\n${normalizeText(title)}\n${normalizeText(body)}`)
    .digest("hex");
}

/** Key used to recognise the same book across Google Books and Open Library. */
export function bookDedupKey(title: string, author: string): string {
  const shortTitle = normalizeText(title.split(/[:(]/)[0] ?? title);
  const lastName = normalizeText(author).split(" ").filter(Boolean).pop() ?? "";
  return `${shortTitle}|${lastName}`;
}
