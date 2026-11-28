/**
 * Splits a card into short "reading units" (one TTS request each) so playback
 * starts fast, the next units can be prefetched, and the current sentence can
 * be highlighted.
 */
import type { TtsLanguage } from "./voices";

export type UnitPart = "title" | "story" | "lead" | "body" | "label" | "action";
export type ReadingUnit = { part: UnitPart; index: number; text: string };
export type ReadingPosition = { part: UnitPart; index: number };

export const MAX_UNIT_CHARS = 500;

function hardSplit(sentence: string, max: number): string[] {
  const out: string[] = [];
  let rest = sentence.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max);
    const cut = Math.max(window.lastIndexOf(", "), window.lastIndexOf("; "), window.lastIndexOf(" "));
    const at = cut > max * 0.4 ? cut + 1 : max;
    out.push(rest.slice(0, at).trim());
    rest = rest.slice(at).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/** Sentences of `text`, each at most `max` characters. Joined with spaces they rebuild the text. */
export function splitSentences(text: string, language: TtsLanguage, max: number = MAX_UNIT_CHARS): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const segmenter = new Intl.Segmenter(language, { granularity: "sentence" });
  const sentences = [...segmenter.segment(clean)].map((s) => s.segment.trim()).filter((s) => /[\p{L}\p{N}]/u.test(s));
  return sentences.flatMap((s) => (s.length > max ? hardSplit(s, max) : [s]));
}

export type SpokenLabels = { takeaway: string; action: string };

/**
 * Reading order of a card: title, the story, "what to remember" (label then the
 * lesson), then "do this today" (label then the action).
 */
export function buildUnits(
  card: { title: string; story?: string | null; body: string; action_step: string },
  labels: SpokenLabels,
  language: TtsLanguage,
): ReadingUnit[] {
  const title = splitSentences(card.title, language).join(" ");
  const units: ReadingUnit[] = [];
  if (title) units.push({ part: "title", index: 0, text: title });
  splitSentences(card.story ?? "", language).forEach((text, index) => units.push({ part: "story", index, text }));
  units.push({ part: "lead", index: 0, text: labels.takeaway });
  splitSentences(card.body, language).forEach((text, index) => units.push({ part: "body", index, text }));
  units.push({ part: "label", index: 0, text: labels.action });
  splitSentences(card.action_step, language).forEach((text, index) => units.push({ part: "action", index, text }));
  return units;
}

/** Strips characters the speech service reads badly (guillemets, stray markup). */
export function speakable(text: string): string {
  return text.replace(/[«»“”]/g, '"').replace(/[<>]/g, " ").replace(/\s+/g, " ").trim();
}

// ---------------------------------------------------------------------------
// Audio segments: a card is read as a few requests, not one per sentence.
// ---------------------------------------------------------------------------

export type Segment = { text: string; units: ReadingUnit[] };

/** Text sent to the voice for one unit: always ends with a stop so the intonation closes. */
export function spoken(text: string): string {
  const s = speakable(text);
  return /[.!?…:;]["')»”]*$/.test(s) ? s : `${s}.`;
}

/**
 * Groups reading units into a few audio segments. The first one is short so that
 * playback starts quickly; the next ones are longer and are prefetched while the
 * previous one plays. The section labels ("what to remember", "do this today") never end a segment.
 */
export function buildSegments(units: ReadingUnit[], firstMax = 170, restMax = 420): Segment[] {
  const segments: Segment[] = [];
  let current: ReadingUnit[] = [];
  let length = 0;
  const flush = () => {
    if (current.length === 0) return;
    segments.push({ units: current, text: current.map((u) => spoken(u.text)).join(" ") });
    current = [];
    length = 0;
  };
  for (const unit of units) {
    const size = spoken(unit.text).length + 1;
    const max = segments.length === 0 ? firstMax : restMax;
    const lastPart = current[current.length - 1]?.part;
    const gluedToNext = lastPart === "label" || lastPart === "lead";
    if (current.length > 0 && !gluedToNext && length + size > max) flush();
    current.push(unit);
    length += size;
  }
  flush();
  return segments;
}

/**
 * Which unit of a segment is being spoken, from the playback position (0..1).
 * Speech time is proportional to the text length plus a small pause allowance per unit.
 */
export function unitAtFraction(units: ReadingUnit[], fraction: number): number {
  if (units.length <= 1) return 0;
  const weights = units.map((u) => spoken(u.text).length + 8);
  const total = weights.reduce((a, b) => a + b, 0);
  const target = Math.min(Math.max(fraction, 0), 0.999999) * total;
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i]!;
    if (target < acc) return i;
  }
  return units.length - 1;
}
