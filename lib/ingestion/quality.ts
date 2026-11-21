/**
 * Content quality rules (no model involved): length limits, a concrete action,
 * no vague filler, short attributed quotes only, and no copying from the source.
 */
import { copiesSource, longestCommonWordRun, MAX_COPIED_RUN } from "./similarity";
import { normalizeText, splitSentences, wordCount } from "./text";
import type { Language } from "./style";

export type QualityInput = {
  language: Language;
  title: string;
  body: string;
  action_step: string;
  quote?: string | null;
  quote_author?: string | null;
};

export type QualityCheck = { ok: boolean; reasons: string[] };

export const LIMITS = {
  titleMin: 3,
  titleMax: 80,
  bodyMinChars: 120,
  bodyMaxChars: 600,
  bodyMinSentences: 2,
  bodyMaxSentences: 4,
  actionMinChars: 15,
  actionMaxChars: 220,
  quoteMaxWords: 14,
} as const;

/** Actions that are not something you can actually do today. */
const VAGUE_ACTIONS: Record<Language, RegExp[]> = {
  fr: [
    /^(essaie|essayez) d'etre\b/,
    /^sois (plus|moins)\b/,
    /^(pense|reflechis) (a|au|aux) (ca|cela|tout ca)\b/,
    /^garde (ca|cela) en tete\b/,
    /^(prends|prenez) conscience\b/,
    /^(continue|continuez) (comme ca|ainsi)\b/,
  ],
  en: [
    /^try to be\b/,
    /^be (more|less)\b/,
    /^(think|reflect) (about|on) (it|this|that)\b/,
    /^keep (this|it|that) in mind\b/,
    /^(become|be) aware\b/,
    /^keep going\b/,
  ],
};

const VAGUE_BODY: Record<Language, RegExp> = {
  fr: /\b(de nombreuses facons|toutes sortes de choses|dans de nombreux domaines|a bien des egards)\b/,
  en: /\b(in many ways|all sorts of things|in many areas of life|in countless ways)\b/,
};

export function checkQuality(card: QualityInput, sourceText?: string | null): QualityCheck {
  const reasons: string[] = [];
  const title = card.title.trim();
  const body = card.body.trim();
  const action = card.action_step.trim();

  if (title.length < LIMITS.titleMin || title.length > LIMITS.titleMax) reasons.push("title_length");
  if (body.length < LIMITS.bodyMinChars) reasons.push("body_too_short");
  if (body.length > LIMITS.bodyMaxChars) reasons.push("body_too_long");

  const sentences = splitSentences(body).length;
  if (sentences < LIMITS.bodyMinSentences || sentences > LIMITS.bodyMaxSentences) {
    reasons.push("body_sentence_count");
  }

  if (action.length < LIMITS.actionMinChars) reasons.push("action_missing_or_too_short");
  if (action.length > LIMITS.actionMaxChars) reasons.push("action_too_long");
  const normalizedAction = normalizeText(action);
  if (VAGUE_ACTIONS[card.language].some((re) => re.test(normalizedAction))) reasons.push("action_vague");
  if (VAGUE_BODY[card.language].test(normalizeText(body))) reasons.push("body_vague");

  if (card.quote) {
    if (wordCount(card.quote) > LIMITS.quoteMaxWords) reasons.push("quote_too_long");
    if (!card.quote_author?.trim()) reasons.push("quote_unattributed");
  }

  if (sourceText) {
    const cardText = `${title} ${body} ${action}`;
    if (copiesSource(cardText, sourceText)) {
      reasons.push(`copied_from_source:${longestCommonWordRun(cardText, sourceText)}>=${MAX_COPIED_RUN}`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}
