import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookTile } from "@/components/BookTile";
import { ChevronLeftIcon } from "@/components/Icons";
import { listBooks } from "@/lib/books";
import { messagesFor } from "@/lib/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ slug: string }> };

async function loadTopic(slug: string) {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, slug, name_fr, name_en, description, description_en").eq("slug", slug).is("parent_id", null).maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const topic = await loadTopic((await params).slug);
  const { locale } = await requireOnboardedUser("/explore");
  return topic ? { title: locale === "fr" ? topic.name_fr : topic.name_en } : {};
}

export default async function TopicPage({ params }: Params) {
  const { slug } = await params;
  const { locale } = await requireOnboardedUser(`/explore/${slug}`);
  const topic = await loadTopic(slug);
  if (!topic) notFound();
  const t = messagesFor(locale);
  const supabase = await createClient();
  const books = await listBooks(supabase, locale, { topicIds: [topic.id], limit: 60 });
  return (
    <div className="flex flex-col gap-6">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeftIcon className="h-4 w-4" /> {t.lib.explore}
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{locale === "fr" ? topic.name_fr : topic.name_en}</h1>
        <p className="mt-1 text-muted">{locale === "fr" ? topic.description : topic.description_en}</p>
      </div>
      {books.length === 0 ? (
        <p className="text-muted">{t.lib.noBooksTopic}</p>
      ) : (
        <div className="flex flex-wrap gap-5">
          {books.map((b) => (
            <BookTile key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
