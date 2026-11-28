/**
 * Rule-based style filter (no model involved). It rejects cards that read
 * like generated text: banned connectors and buzzwords, monotonous sentence
 * lengths, repeated sentence openers, symmetrical constructions, openings that
 * restate the title, and structures that repeat across recent cards.
 */
import { normalizeText, splitSentences, tokenize, wordCount } from "./text";

export type Language = "fr" | "en";

export type StyleInput = {
  language: Language;
  title: string;
  /** The short story that opens the card (third person, so no "you" required there). */
  story?: string | null;
  body: string;
  action_step: string;
};

export type StructureSignature = {
  opening: "question" | "number" | "direct" | "confession" | "scene";
  shape: string;
};

export type StyleCheck = { ok: boolean; reasons: string[] };

/** Phrases that the generation prompt forbids, matched on normalized text. */
export const BANNED_PHRASES: Record<Language, RegExp[]> = {
  fr: [
    /\bil est important de\b/,
    /\bil est essentiel de\b/,
    /\ben effet\b/,
    /(^|[.!?]\s*)de plus\b/,
    /\bde plus,/,
    /\bpar ailleurs\b/,
    /\ben conclusion\b/,
    /\bdans un monde ou\b/,
    /\bn'oubliez pas\b/,
    /\bn'oublie pas que\b/,
    /\bque vous soyez\b/,
    /\bque tu sois\b/,
    /\bnon seulement\b/,
    /\ben somme\b/,
    /\bainsi donc\b/,
  ],
  en: [
    /\bit is important to\b/,
    /\bit's important to\b/,
    /\bmoreover\b/,
    /\bfurthermore\b/,
    /\bin conclusion\b/,
    /\bin a world where\b/,
    /\bdon't forget that\b/,
    /\bwhether you're\b/,
    /\bwhether you are\b/,
    /\bnot only\b/,
    /\badditionally\b/,
    /\bin today's\b/,
    /\bit's worth noting\b/,
  ],
};

export const BANNED_WORDS: Record<Language, RegExp[]> = {
  fr: [/\bcrucia(l|le|ux|les)\b/, /\bessentiel(le|s|les)?\b/, /\bfondamenta(l|le|ux|les)\b/, /\bpivot(s)?\b/, /\blevier(s)?\b/, /\bparadigme(s)?\b/],
  en: [/\bcrucial\b/, /\bessential\b/, /\bfundamental(ly)?\b/, /\bpivotal\b/, /\bleverag(e|es|ing)\b/, /\bparadigm(s)?\b/, /\bdelve\b/],
};

const ADJECTIVE_SUFFIXES: Record<Language, RegExp> = {
  fr: /(eux|euse|ible|able|if|ive|ant|ante|ent|ente|al|ale|el|elle|ique|aire)$/,
  en: /(ful|ous|ive|able|ible|al|ic|ent|ant|less|ing)$/,
};

const SECOND_PERSON: Record<Language, RegExp> = {
  fr: /\b(tu|te|toi|ton|ta|tes|t'\p{L}+)\b/u,
  en: /\b(you|your|yours|yourself)\b/,
};

/** Coefficient of variation of sentence lengths below which a card is too even. */
export const MIN_SENTENCE_LENGTH_VARIATION = 0.15;
/** Share of recent cards with the same structure above which a card is rejected. */
export const MAX_STRUCTURE_SHARE = 0.3;
/** Minimum number of recent cards before the structure check applies. */
export const MIN_STRUCTURE_SAMPLE = 8;

const CONFESSION: Record<Language, RegExp> = {
  fr: /^(je|j'|moi|longtemps|pendant des annees|avoue)/,
  en: /^(i|i'm|i've|for years|confession|honestly)\b/,
};
const SCENE: Record<Language, RegExp> = {
  fr: /^(imagine|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|ce matin|hier|il est \d|tu es en|tu rentres|tu arrives|en reunion|au bureau)/,
  en: /^(picture|imagine|monday|tuesday|wednesday|thursday|friday|saturday|sunday|this morning|yesterday|it's \d|you're in|you walk|you get home)/,
};

export function sentenceLengths(text: string): number[] {
  return splitSentences(text).map(wordCount);
}

export function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 1;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

export function structureSignature(language: Language, body: string): StructureSignature {
  const sentences = splitSentences(body);
  const first = normalizeText(sentences[0] ?? "");
  let opening: StructureSignature["opening"] = "direct";
  if ((sentences[0] ?? "").trim().endsWith("?")) opening = "question";
  else if (/^\d/.test(first)) opening = "number";
  else if (CONFESSION[language].test(first)) opening = "confession";
  else if (SCENE[language].test(first)) opening = "scene";

  const shape = sentences
    .map((s) => {
      const t = s.trim();
      if (t.endsWith("?")) return "Q";
      if (t.endsWith("!")) return "X";
      const n = wordCount(t);
      if (n <= 6) return "S";
      if (n <= 16) return "M";
      return "L";
    })
    .join("");
  return { opening, shape };
}

export function sameStructure(a: StructureSignature, b: StructureSignature): boolean {
  return a.opening === b.opening && a.shape === b.shape;
}

/** Share of `recent` signatures identical to `signature` (0 when the sample is too small). */
export function structureShare(signature: StructureSignature, recent: StructureSignature[]): number {
  if (recent.length < MIN_STRUCTURE_SAMPLE) return 0;
  return recent.filter((r) => sameStructure(signature, r)).length / recent.length;
}

/** Lowercase and strip accents, but keep punctuation. */
function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[’`]/g, "'")
    .toLowerCase();
}

function hasAdjectiveTriad(language: Language, text: string): boolean {
  const joiner = language === "fr" ? "et" : "and";
  const re = new RegExp(`\\b(\\p{L}{4,}), (\\p{L}{4,}),? ${joiner} (\\p{L}{4,})\\b`, "gu");
  for (const match of fold(text).matchAll(re)) {
    const words = [match[1], match[2], match[3]];
    if (words.every((w) => ADJECTIVE_SUFFIXES[language].test(w))) return true;
  }
  return false;
}

function openingRestatesTitle(title: string, body: string): boolean {
  const titleWords = new Set(tokenize(title).filter((w) => w.length > 3));
  if (titleWords.size < 2) return false;
  const firstSentence = new Set(tokenize(splitSentences(body)[0] ?? "").filter((w) => w.length > 3));
  let shared = 0;
  for (const w of titleWords) if (firstSentence.has(w)) shared += 1;
  return shared / titleWords.size >= 0.7;
}

export function checkStyle(card: StyleInput, recent: StructureSignature[] = []): StyleCheck {
  const reasons: string[] = [];
  const lang = card.language;
  const story = card.story?.trim() ?? "";
  const full = `${card.title}. ${story} ${card.body} ${card.action_step}`;
  const normalizedFull = fold(full);

  for (const re of BANNED_PHRASES[lang]) {
    if (re.test(normalizedFull)) reasons.push(`banned_phrase:${re.source}`);
  }
  for (const re of BANNED_WORDS[lang]) {
    if (re.test(normalizedFull)) reasons.push(`banned_word:${re.source}`);
  }

  // Rhythm is judged over all the card's sentences (story + lesson), not the short lesson alone.
  const lengths = sentenceLengths(`${story} ${card.body}`);
  if (lengths.length >= 2 && coefficientOfVariation(lengths) < MIN_SENTENCE_LENGTH_VARIATION) {
    reasons.push("uniform_sentence_length");
  }

  const storyLengths = sentenceLengths(story);
  if (storyLengths.length >= 3 && coefficientOfVariation(storyLengths) < MIN_SENTENCE_LENGTH_VARIATION) {
    reasons.push("uniform_story_sentence_length");
  }
  // A narrative naturally repeats its character's name or a pronoun, so the limit is looser here.
  const storyOpeners = new Map<string, number>();
  for (const sentence of splitSentences(story)) {
    const first = tokenize(sentence)[0];
    if (first) storyOpeners.set(first, (storyOpeners.get(first) ?? 0) + 1);
  }
  for (const [word, count] of storyOpeners) {
    if (count > 3) reasons.push(`story_repeated_opener:${word}`);
  }

  const openers = new Map<string, number>();
  for (const sentence of splitSentences(`${card.body} ${card.action_step}`)) {
    const first = tokenize(sentence)[0];
    if (first) openers.set(first, (openers.get(first) ?? 0) + 1);
  }
  for (const [word, count] of openers) {
    if (count > 2) reasons.push(`repeated_opener:${word}`);
  }

  if ((full.match(/—/g) ?? []).length > 1) reasons.push("em_dash_series");
  if (hasAdjectiveTriad(lang, `${story} ${card.body}`)) reasons.push("adjective_triad");
  if (openingRestatesTitle(card.title, story || card.body)) reasons.push("opening_restates_title");

  if (!SECOND_PERSON[lang].test(normalizeText(`${card.body} ${card.action_step}`))) {
    reasons.push("no_direct_address");
  }
  if (lang === "fr" && /\bvous\b/.test(normalizeText(card.body)) && /\bvous\b/.test(normalizeText(card.action_step))) {
    reasons.push("vouvoiement");
  }

  const signature = structureSignature(lang, story || card.body);
  if (structureShare(signature, recent) > MAX_STRUCTURE_SHARE) {
    reasons.push("repetitive_structure");
  }

  return { ok: reasons.length === 0, reasons };
}
