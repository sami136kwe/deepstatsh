import type { Metadata } from "next";
import Link from "next/link";
import { BookTile, Shelf } from "@/components/BookTile";
import { SearchIcon } from "@/components/Icons";
import { listBooks } from "@/lib/books";
import { mainCategories } from "@/lib/categories";
import { messagesFor } from "@/lib/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await requireOnboardedUser("/explore");
  return { title: messagesFor(locale).lib.explore };
}

export default async function ExplorePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { locale } = await requireOnboardedUser("/explore");
  const t = messagesFor(locale);
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const supabase = await createClient();
  const [topics, results] = await Promise.all([mainCategories(supabase), q ? listBooks(supabase, locale, { search: q, limit: 60 }) : Promise.resolve(null)]);
  const sections = (await Promise.all(topics.map(async (topic) => ({ topic, books: await listBooks(supabase, locale, { topicIds: [topic.id], limit: 12 }) })))).filter((x) => x.books.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold tracking-tight">{t.lib.explore}</h1>
      <form role="search" className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input name="q" defaultValue={q} className="input pl-11" placeholder={t.lib.searchPlaceholder} aria-label={t.lib.searchPlaceholder} />
      </form>
      {results ? (
        results.length === 0 ? (
          <p className="text-muted">{t.lib.emptyShelf}</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {results.map((b) => (
              <BookTile key={b.id} book={b} />
            ))}
          </div>
        )
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {topics.map((c) => (
              <li key={c.id}>
                <Link href={`/explore/${c.slug}`} className="card-surface flex h-full items-center gap-3 p-4 text-sm font-semibold hover:border-accent">
                  <span aria-hidden="true" className="text-xl">{c.icon}</span>
                  {locale === "fr" ? c.name_fr : c.name_en}
                </Link>
              </li>
            ))}
          </ul>
          {sections.map(({ topic, books }) => (
            <Shelf key={topic.id} title={locale === "fr" ? topic.name_fr : topic.name_en} href={`/explore/${topic.slug}`} seeAll={t.lib.seeAll}>
              {books.map((b) => (
                <BookTile key={b.id} book={b} />
              ))}
            </Shelf>
          ))}
        </>
      )}
    </div>
  );
}
