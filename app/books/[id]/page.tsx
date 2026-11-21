import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CardGrid } from "@/components/CardGrid";
import { CARD_FIELDS } from "@/lib/cards";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/api";

type Params = { params: Promise<{ id: string }> };

async function loadBook(id: string) {
  if (!uuidSchema.safeParse(id).success) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("books").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const book = await loadBook((await params).id);
  return book ? { title: `${book.title} — ${book.author}` } : {};
}

export default async function BookPage({ params }: Params) {
  const { id } = await params;
  const book = await loadBook(id);
  if (!book) notFound();
  const { locale } = await getViewer();
  const t = messagesFor(locale);
  const supabase = await createClient();
  const { data: cards } = await supabase
    .from("card_details")
    .select(CARD_FIELDS)
    .eq("book_id", id)
    .eq("status", "published")
    .eq("language", locale)
    .order("quality_score", { ascending: false, nullsFirst: false })
    .limit(30);

  const libraryUrl = `https://search.worldcat.org/search?q=${encodeURIComponent(`${book.title} ${book.author}`)}`;
  const googleUrl = book.google_books_id ? book.info_link : null;
  const openLibraryUrl = book.open_library_id ? `https://openlibrary.org/works/${book.open_library_id}` : !googleUrl ? book.info_link : null;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6 sm:flex-row">
        {book.cover_url ? (
          <Image src={book.cover_url} alt="" width={160} height={240} className="h-60 w-40 shrink-0 rounded-xl border border-line object-cover shadow-sm" />
        ) : (
          <div aria-hidden="true" className="flex h-60 w-40 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 p-4 text-center font-serif text-lg">
            {book.title}
          </div>
        )}
        <div className="flex flex-col gap-3">
          <h1 className="font-serif text-3xl font-bold leading-tight">{book.title}</h1>
          <p className="text-lg text-muted">
            {t.book.by} {book.author}
            {book.published_year ? ` · ${book.published_year}` : ""}
          </p>
          <div className="flex flex-wrap gap-2">
            {book.is_public_domain && <span className="chip">{t.book.publicDomain}</span>}
            {book.average_rating && book.ratings_count > 0 && (
              <span className="chip">★ {t.book.rating(Number(book.average_rating), book.ratings_count)}</span>
            )}
          </div>
          {book.description && <p className="max-w-2xl whitespace-pre-line leading-relaxed text-ink/90">{book.description.slice(0, 1200)}</p>}
          <div className="flex flex-wrap gap-2">
            {googleUrl && (
              <a href={googleUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                {t.book.buy}
              </a>
            )}
            {openLibraryUrl && (
              <a href={openLibraryUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                {t.book.openLibrary}
              </a>
            )}
            <a href={libraryUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost">
              {t.book.library}
            </a>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">{t.book.cards}</h2>
        {cards && cards.length > 0 ? <CardGrid cards={cards} /> : <p className="text-muted">{t.book.noCards}</p>}
      </section>
    </div>
  );
}
