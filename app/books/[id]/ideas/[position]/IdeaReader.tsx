"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeftIcon } from "@/components/Icons";
import { StashButton } from "@/components/StashButton";
import { SpeakButton } from "@/components/SpeakButton";
import { VoicePicker } from "@/components/VoicePicker";
import type { IdeaSummary } from "@/lib/books";
import { useT } from "@/lib/i18n/client";
import { localDay } from "@/lib/client/api";
import { splitSentences } from "@/lib/tts/segment";
import { useReadAloud } from "@/lib/tts/useReadAloud";

type Props = {
  idea: IdeaSummary;
  bookId: string;
  bookTitle: string;
  total: number;
  alreadyDone: boolean;
  stashed: boolean;
  nextPosition: number | null;
  labels: { remember: string };
};

/** One idea: a story that scrolls, then "what to remember", then one action. */
export function IdeaReader({ idea, bookId, bookTitle, total, alreadyDone, stashed, nextPosition, labels }: Props) {
  const t = useT();
  const router = useRouter();
  const audio = useReadAloud(idea);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const language = idea.language === "en" ? "en" : "fr";
  const reading = audio.reading;
  const mark = "rounded bg-accent-soft";
  const on = (part: string, index = 0) => reading?.part === part && reading.index === index;

  // Opening an idea starts the book and logs the reading.
  useEffect(() => {
    void fetch("/api/ideas/open", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cardId: idea.id, day: localDay() }) });
  }, [idea.id]);

  async function next() {
    setBusy(true);
    setError(false);
    audio.stop();
    const res = await fetch("/api/ideas/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ cardId: idea.id, day: localDay() }) });
    if (!res.ok) {
      setBusy(false);
      setError(true);
      return;
    }
    router.push(nextPosition ? `/books/${bookId}/ideas/${nextPosition}` : `/books/${bookId}?done=1`);
    router.refresh();
  }

  const sentences = (text: string) => splitSentences(text, language);
  /** Sentences grouped two by two into paragraphs, so the story reads as a flowing narration with air between paragraphs. */
  function paragraphs(list: string[]) {
    const groups: { text: string; index: number }[][] = [];
    list.forEach((text, index) => {
      if (index % 2 === 0) groups.push([]);
      groups[groups.length - 1]!.push({ text, index });
    });
    return groups;
  }
  const cta = nextPosition ? t.lib.ctaNextIdea : t.lib.ctaFinishBook;

  return (
    <article className="mx-auto flex max-w-xl flex-col gap-6" lang={idea.language}>
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/books/${bookId}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ChevronLeftIcon className="h-4 w-4" /> {bookTitle}
          </Link>
          <span className="text-sm text-muted">
            {idea.position}/{total}
          </span>
        </div>
        <div className="flex gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={idea.position}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i < idea.position ? "bg-accent" : "bg-surface-2"}`} />
          ))}
        </div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent">{t.lib.ideaN(idea.position)}</p>
        <h1 className={`font-serif text-3xl font-bold leading-tight tracking-tight ${on("title") ? mark : ""}`}>{idea.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <SpeakButton state={audio.state} onToggle={audio.toggle} />
          <VoicePicker language={audio.language} voice={audio.voice} onChange={audio.setVoice} />
        </div>
      </header>

      {idea.story && (
        <section aria-label={t.common.story} className="flex flex-col gap-6 font-serif text-xl leading-9 text-ink/95" data-testid="idea-story">
          {paragraphs(sentences(idea.story)).map((group, g) => (
            <p key={g} data-testid="story-block">
              {group.map(({ text, index }) => (
                <span key={index} className={`rounded transition-colors ${on("story", index) ? "bg-accent-soft" : ""}`}>
                  {text}{" "}
                </span>
              ))}
            </p>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-3xl bg-surface p-6" data-testid="idea-remember">
        <h2 className="text-sm font-bold uppercase tracking-wider text-accent">{labels.remember}</h2>
        <p className="text-lg font-medium leading-relaxed">
          {sentences(idea.body).map((s, i) => (
            <span key={i} className={`rounded ${on("body", i) ? "bg-accent-soft" : ""}`}>
              {s}{" "}
            </span>
          ))}
        </p>
      </section>

      <section className={`flex flex-col gap-3 rounded-3xl bg-accent-soft p-6 ${on("label") || on("action") ? "ring-2 ring-accent" : ""}`}>
        <h2 className="text-sm font-bold uppercase tracking-wider text-accent">{t.common.actionToday}</h2>
        <p className="text-lg font-medium leading-relaxed">{idea.action_step}</p>
      </section>

      <StashButton cardId={idea.id} initiallyStashed={stashed} />

      {error && (
        <p role="alert" className="text-sm text-danger">
          {t.common.error}
        </p>
      )}
      <button type="button" className="btn-primary h-12 w-full text-base" onClick={next} disabled={busy} data-testid="idea-continue">
        {alreadyDone && !nextPosition ? t.lib.backToBook : cta}
      </button>
    </article>
  );
}
