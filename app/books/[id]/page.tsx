import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookCover } from "@/components/BookCover";
import { ChevronLeftIcon, CheckIcon, LockIcon } from "@/components/Icons";
import { SaveBookButton } from "@/components/SaveBookButton";
import { bookTopics, getBook, getIdeas, getProgress } from "@/lib/books";
import { ideaStates, nextIdeaPosition, percent } from "@/lib/books-logic";
import { messagesFor } from "@/lib/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/api";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return {};
  const { locale } = await requireOnboardedUser(`/books/${id}`);
  const book = await getBook(await createClient(), id, locale);
  return book ? { title: `${book.title} — ${book.author}` } : {};
}

export default async function BookPage({ params }: Params) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { user, locale } = await requireOnboardedUser(`/books/${id}`);
  const t = messagesFor(locale);
  const supabase = await createClient();
  const book = await getBook(supabase, id, locale);
  if (!book) notFound();

  const [ideas, progress, topics] = await Promise.all([getIdeas(supabase, id, book.language), getProgress(supabase, user.id, id), bookTopics(supabase, id)]);
  const positions = ideas.map((i) => i.position);
  const states = ideaStates(positions, progress.completed);
  const next = nextIdeaPosition(positions, progress.completed);
  const done = ideas.filter((i) => progress.completed.has(i.position)).length;
  const started = done > 0 || !!progress.startedAt;
  const cta = next === null ? (ideas[0] ? { pos: ideas[0].position, label: t.lib.readAgain } : null) : { pos: next, label: started ? t.lib.continueBook : t.lib.startBook };

  return (
    <div className="flex flex-col gap-6">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeftIcon className="h-4 w-4" /> {t.lib.explore}
      </Link>

      <section className="flex flex-col items-center gap-4 text-center">
        <BookCover title={book.title} author={book.author} coverUrl={book.cover_url} seed={book.slug ?? book.id} size="lg" />
        <div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight">{book.title}</h1>
          <p className="mt-1 text-muted">
            {book.author}
            {book.published_year ? ` · ${book.published_year}` : ""}
          </p>
        </div>
        <ul className="flex flex-wrap justify-center gap-2">
          {topics.map((c) => (
            <li key={c.id}>
              <Link href={`/explore/${c.slug}`} className="chip hover:text-ink">
                {locale === "fr" ? c.name_fr : c.name_en}
              </Link>
            </li>
          ))}
          <li className="chip">{t.lib.ideas(ideas.length)}</li>
        </ul>
        {book.fallback && <p className="text-sm text-muted">{locale === "fr" ? t.lib.onlyEnglish : t.lib.onlyEnglish}</p>}
        <div className="flex w-full max-w-sm items-center gap-3">
          {cta && (
            <Link href={`/books/${id}/ideas/${cta.pos}`} className="btn-primary h-11 flex-1" data-testid="book-cta">
              {cta.label}
            </Link>
          )}
          <SaveBookButton bookId={id} saved={progress.isSaved} />
        </div>
      </section>

      {ideas.length > 0 && (
        <section aria-label={t.lib.progress(done, ideas.length)} className="flex flex-col gap-2">
          <div className="flex justify-between text-sm text-muted">
            <span>{t.lib.progress(done, ideas.length)}</span>
            <span>{percent(done, ideas.length)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={ideas.length} aria-valuenow={done}>
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percent(done, ideas.length)}%` }} />
          </div>
        </section>
      )}

      {book.summary && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{t.lib.about}</h2>
          <p className="leading-relaxed text-ink/90">{book.summary}</p>
        </section>
      )}

      <ol className="flex flex-col gap-2" aria-label={t.lib.ideas(ideas.length)}>
        {ideas.map((idea) => {
          const state = states.get(idea.position) ?? "locked";
          const inner = (
            <>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${state === "completed" ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>
                {state === "completed" ? <CheckIcon className="h-5 w-5" /> : state === "locked" ? <LockIcon className="h-4 w-4" /> : idea.position}
              </span>
              <span className="flex flex-col text-left">
                <span className="text-xs text-muted">{t.lib.ideaN(idea.position)}</span>
                <span className="font-semibold leading-snug">{idea.title}</span>
              </span>
            </>
          );
          return (
            <li key={idea.id} data-state={state}>
              {state === "locked" ? (
                <div className="card-surface flex items-center gap-3 p-3 opacity-60" title={t.lib.locked} aria-disabled="true">
                  {inner}
                </div>
              ) : (
                <Link href={`/books/${id}/ideas/${idea.position}`} className="card-surface flex items-center gap-3 p-3 hover:border-accent">
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-muted">{t.lib.inspired}</p>
    </div>
  );
}
