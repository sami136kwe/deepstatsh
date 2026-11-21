import type { Metadata } from "next";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer } from "@/lib/session";
import { SearchClient } from "./SearchClient";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).search.title };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { locale } = await getViewer();
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-bold">{messagesFor(locale).search.title}</h1>
      <SearchClient initialQuery={typeof q === "string" ? q.slice(0, 100) : ""} />
    </div>
  );
}
