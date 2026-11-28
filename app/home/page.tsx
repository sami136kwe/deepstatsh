import type { Metadata } from "next";
import { BookTile, Shelf } from "@/components/BookTile";
import { doneCounts, libraryBooks, listBooks } from "@/lib/books";
import { mainCategories } from "@/lib/categories";
import { messagesFor } from "@/lib/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await requireOnboardedUser("/home");
  return { title: messagesFor(locale).lib.home };
}

export default async function HomePage() {
  const { user, locale, profile } = await requireOnboardedUser("/home");
  const t = messagesFor(locale);
  const supabase = await createClient();

  const topicIds = profile.interests;

  const [current, forYou, latest, featured, topics] = await Promise.all([
    libraryBooks(supabase, user.id, "in_progress", locale),
    topicIds.length ? listBooks(supabase, locale, { topicIds, limit: 10 }) : Promise.resolve([]),
    listBooks(supabase, locale, { order: "recent", limit: 10 }),
    listBooks(supabase, locale, { featured: true, limit: 10 }),
    mainCategories(supabase),
  ]);
  const sections = (await Promise.all(topics.map(async (topic) => ({ topic, books: await listBooks(supabase, locale, { topicIds: [topic.id], limit: 12 }) })))).filter((x) => x.books.length > 0);
  const counts = await doneCounts(supabase, user.id, [...forYou, ...latest, ...featured, ...sections.flatMap((x) => x.books)].map((b) => b.id));
  const progress = (id: string) => counts.get(id);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="sr-only">{t.lib.home}</h1>
      {current.length > 0 && (
        <Shelf title={t.lib.continueReading}>
          {current.map((b) => (
            <BookTile key={b.id} book={b} done={b.done} />
          ))}
        </Shelf>
      )}
      {forYou.length > 0 && (
        <Shelf title={t.lib.forYou} href="/explore" seeAll={t.lib.seeAll}>
          {forYou.map((b) => (
            <BookTile key={b.id} book={b} done={progress(b.id)} />
          ))}
        </Shelf>
      )}
      <Shelf title={t.lib.latest} href="/explore" seeAll={t.lib.seeAll}>
        {latest.map((b) => (
          <BookTile key={b.id} book={b} done={progress(b.id)} />
        ))}
      </Shelf>
      {featured.length > 0 && (
        <Shelf title={t.lib.featured}>
          {featured.map((b) => (
            <BookTile key={b.id} book={b} done={progress(b.id)} size="lg" />
          ))}
        </Shelf>
      )}
      {sections.map(({ topic, books }) => (
        <Shelf key={topic.id} title={`${topic.icon ?? ""} ${locale === "fr" ? topic.name_fr : topic.name_en}`.trim()} href={`/explore/${topic.slug}`} seeAll={t.lib.seeAll}>
          {books.map((b) => (
            <BookTile key={b.id} book={b} done={progress(b.id)} />
          ))}
        </Shelf>
      ))}
    </div>
  );
}
