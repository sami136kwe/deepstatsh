import type { Metadata } from "next";
import Link from "next/link";
import { BookTile } from "@/components/BookTile";
import { libraryBooks, type LibraryShelf } from "@/lib/books";
import { messagesFor } from "@/lib/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await requireOnboardedUser("/library");
  return { title: messagesFor(locale).lib.library };
}

const SHELVES: LibraryShelf[] = ["in_progress", "saved", "completed"];

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ shelf?: string }> }) {
  const { user, locale } = await requireOnboardedUser("/library");
  const t = messagesFor(locale);
  const raw = (await searchParams).shelf;
  const shelf: LibraryShelf = SHELVES.find((s) => s === raw) ?? "in_progress";
  const supabase = await createClient();
  const books = await libraryBooks(supabase, user.id, shelf, locale);
  const labels: Record<LibraryShelf, string> = { in_progress: t.lib.inProgress, saved: t.lib.savedShelf, completed: t.lib.completedShelf };
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{t.lib.library}</h1>
      <nav aria-label={t.lib.library} className="flex gap-2">
        {SHELVES.map((s) => (
          <Link key={s} href={`/library?shelf=${s}`} aria-current={s === shelf ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold ${s === shelf ? "bg-accent text-accent-ink" : "bg-surface-2 text-muted"}`}>
            {labels[s]}
          </Link>
        ))}
      </nav>
      {books.length === 0 ? (
        <p className="text-muted">{t.lib.emptyLibrary}</p>
      ) : (
        <div className="flex flex-wrap gap-5">
          {books.map((b) => (
            <BookTile key={b.id} book={b} done={b.done} />
          ))}
        </div>
      )}
    </div>
  );
}
