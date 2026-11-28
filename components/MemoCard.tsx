"use client";

import Link from "next/link";
import type { CardSummary } from "@/lib/cards";
import { useLocale, useT } from "@/lib/i18n/client";
import { splitSentences, type ReadingPosition } from "@/lib/tts/segment";

type Props = {
  card: CardSummary;
  discovery?: boolean;
  /** "full" for the feed and card page, "compact" for lists. */
  variant?: "full" | "compact";
  /** Hide body and action (review mode before reveal). */
  hideContent?: boolean;
  headingLevel?: "h1" | "h2" | "h3";
  /** Sentence being read aloud. `undefined` = no read-aloud on this card, `null` = nothing playing. */
  reading?: ReadingPosition | null;
  children?: React.ReactNode;
};

export function CategoryChip({ card }: { card: Pick<CardSummary, "category_icon" | "category_name_fr" | "category_name_en" | "category_slug"> }) {
  const locale = useLocale();
  return (
    <Link href={`/categories/${card.category_slug}`} className="chip hover:text-ink">
      {card.category_icon && <span aria-hidden="true">{card.category_icon}</span>}
      {locale === "fr" ? card.category_name_fr : card.category_name_en}
    </Link>
  );
}

export function MemoCard({ card, discovery, variant = "full", hideContent, headingLevel = "h2", reading, children }: Props) {
  const t = useT();
  const Heading = headingLevel;
  const full = variant === "full";
  const language = card.language === "en" ? "en" : "fr";
  const bodySentences = reading !== undefined ? splitSentences(card.body, language) : null;
  const storySentences = reading !== undefined && card.story ? splitSentences(card.story, language) : null;
  const on = (part: ReadingPosition["part"], index = 0) => reading?.part === part && reading.index === index;
  const mark = "rounded bg-accent-soft";
  const textSize = full ? "text-lg leading-relaxed" : "text-base leading-relaxed";
  const story = card.story ? (
    <p className={`font-serif ${textSize} text-ink/90`}>
      {storySentences
        ? storySentences.map((sentence, i) => (
            <span key={i} className={on("story", i) ? mark : ""}>
              {sentence}{" "}
            </span>
          ))
        : card.story}
    </p>
  ) : null;
  return (
    <article className={`card-surface flex flex-col ${full ? "gap-5 p-6 sm:p-8" : "gap-3 p-5"}`} lang={card.language}>
      <div className="flex flex-wrap items-center gap-2">
        <CategoryChip card={card} />
        <span className="chip">{t.common.difficulty[card.difficulty] ?? ""}</span>
        {discovery && <span className="chip bg-accent-soft text-accent">{t.common.discovery}</span>}
      </div>

      <Heading className={`font-serif font-bold leading-tight tracking-tight ${full ? "text-3xl sm:text-4xl" : "text-xl"} ${on("title") ? mark : ""}`}>
        {card.title}
      </Heading>

      {!hideContent && (
        <>
          {story && full && (
            <section aria-label={t.common.story} className="flex flex-col gap-1.5 border-l-4 border-line pl-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{t.common.story}</p>
              {story}
            </section>
          )}
          {story && !full && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-accent">{t.common.readStory}</summary>
              <div className="mt-2 border-l-4 border-line pl-3">{story}</div>
            </details>
          )}

          <section className={`flex flex-col gap-1.5 ${on("lead") ? "rounded ring-2 ring-accent" : ""}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-muted">{t.common.takeaway}</p>
            <p className={`${textSize} font-medium text-ink`}>
              {bodySentences
                ? bodySentences.map((sentence, i) => (
                    <span key={i} className={on("body", i) ? mark : ""}>
                      {sentence}{" "}
                    </span>
                  ))
                : card.body}
            </p>
          </section>

          {card.quote && (
            <blockquote className="border-l-4 border-accent pl-4 font-serif text-lg italic text-muted">
              « {card.quote} »{card.quote_author && <footer className="mt-1 text-sm not-italic">{card.quote_author}</footer>}
            </blockquote>
          )}

          <div className={`rounded-2xl bg-accent-soft p-4 ${on("label") || on("action") ? "ring-2 ring-accent" : ""}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">{t.common.actionToday}</p>
            <p className="mt-1 font-medium">
              {card.action_step}
            </p>
          </div>
        </>
      )}

      {card.book_id && card.book_title && (
        <p className="text-sm text-muted">
          {t.common.source} :{" "}
          <Link href={`/books/${card.book_id}`} className="font-medium text-ink underline decoration-line underline-offset-4 hover:decoration-accent">
            {card.book_title}
          </Link>
          {card.book_author && <> — {card.book_author}</>}
        </p>
      )}

      {children}
    </article>
  );
}
