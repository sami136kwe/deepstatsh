/**
 * Pure logic for the book library (no database access): which language a book is
 * shown in, which ideas are unlocked, reading progress and generated covers.
 */

export type ContentLanguage = "fr" | "en";

type LanguageRow = { id: string | null; language: string | null; idea_count: number | null };

/**
 * `book_overview` has one row per book and language. Keep one row per book: the
 * user's language when the book has ideas in it, otherwise English, otherwise
 * any language that has ideas. Books with no readable idea are dropped.
 * `fallback` tells that the shown language is not the preferred one.
 */
export function pickLanguageRows<T extends LanguageRow>(rows: T[], preferred: ContentLanguage): (T & { fallback: boolean })[] {
  const byBook = new Map<string, T[]>();
  const order: string[] = [];
  for (const row of rows) {
    if (!row.id) continue;
    if (!byBook.has(row.id)) {
      byBook.set(row.id, []);
      order.push(row.id);
    }
    byBook.get(row.id)!.push(row);
  }
  const out: (T & { fallback: boolean })[] = [];
  for (const id of order) {
    const options = byBook.get(id)!.filter((r) => (r.idea_count ?? 0) > 0);
    const chosen = options.find((r) => r.language === preferred) ?? options.find((r) => r.language === "en") ?? options[0];
    if (chosen) out.push({ ...chosen, fallback: chosen.language !== preferred });
  }
  return out;
}

export type IdeaState = "completed" | "unlocked" | "locked";

/**
 * Ideas are unlocked in order: an idea is open when every idea before it is done.
 * `completed` holds the positions already finished.
 */
export function ideaStates(positions: number[], completed: ReadonlySet<number>): Map<number, IdeaState> {
  const states = new Map<number, IdeaState>();
  let allBeforeDone = true;
  for (const position of [...positions].sort((a, b) => a - b)) {
    if (completed.has(position)) states.set(position, "completed");
    else states.set(position, allBeforeDone ? "unlocked" : "locked");
    if (!completed.has(position)) allBeforeDone = false;
  }
  return states;
}

/** Position of the idea to open next: the first idea not done yet, or null when the book is finished. */
export function nextIdeaPosition(positions: number[], completed: ReadonlySet<number>): number | null {
  for (const position of [...positions].sort((a, b) => a - b)) if (!completed.has(position)) return position;
  return null;
}

export function percent(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((Math.min(done, total) / total) * 100);
}

/** Small stable hash (FNV-1a) used to give each book its own cover colours. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Two HSL colours for a generated cover, always dark enough for light text. */
export function coverColors(seed: string): { from: string; to: string; accent: string } {
  const h = hashString(seed) % 360;
  const h2 = (h + 40 + (hashString(`${seed}!`) % 50)) % 360;
  return {
    from: `hsl(${h} 45% 22%)`,
    to: `hsl(${h2} 50% 12%)`,
    accent: `hsl(${h} 80% 72%)`,
  };
}
