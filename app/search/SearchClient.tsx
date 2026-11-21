"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CardGrid } from "@/components/CardGrid";
import { ErrorState, Spinner } from "@/components/States";
import type { CardSummary } from "@/lib/cards";
import { apiFetch } from "@/lib/client/api";
import { useLocale, useT } from "@/lib/i18n/client";

type Results = {
  cards: CardSummary[];
  books: { id: string; title: string; author: string; cover_url: string | null; published_year: number | null }[];
  categories: { id: string; slug: string; name_fr: string; name_en: string; icon: string | null; parent_id: string | null }[];
};

export function SearchClient({ initialQuery }: { initialQuery: string }) {
  const t = useT();
  const locale = useLocale();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Results | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    const q = query.trim();
    const url = new URL(window.location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
    if (q.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      setStatus("idle");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const data = await apiFetch<Results>(`/api/search?${new URLSearchParams({ q })}`, { signal: controller.signal });
        setResults(data);
        setStatus("idle");
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setStatus("error");
      }
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const empty = results && results.cards.length === 0 && results.books.length === 0 && results.categories.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <label>
        <span className="sr-only">{t.search.placeholder}</span>
        <input
          type="search"
          className="input py-3 text-lg"
          placeholder={t.search.placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          maxLength={100}
        />
      </label>

      {status === "loading" && <Spinner />}
      {status === "error" && <ErrorState />}
      {query.trim().length > 0 && query.trim().length < 2 && <p className="text-muted">{t.search.hint}</p>}
      {empty && status === "idle" && <p className="text-muted">{t.search.empty}</p>}

      {results && status === "idle" && (
        <>
          {results.categories.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">{t.search.categories}</h2>
              <ul className="flex flex-wrap gap-2">
                {results.categories.map((c) => (
                  <li key={c.id}>
                    <Link href={`/categories/${c.slug}`} className="chip text-sm hover:text-ink">
                      {c.icon && <span aria-hidden="true">{c.icon}</span>}
                      {locale === "fr" ? c.name_fr : c.name_en}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.books.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">{t.search.books}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {results.books.map((b) => (
                  <li key={b.id}>
                    <Link href={`/books/${b.id}`} className="card-surface flex items-center gap-4 p-3 hover:bg-surface-2">
                      {b.cover_url ? (
                        <Image src={b.cover_url} alt="" width={40} height={60} className="h-15 w-10 rounded object-cover" />
                      ) : (
                        <span aria-hidden="true" className="flex h-15 w-10 items-center justify-center rounded bg-surface-2">
                          📖
                        </span>
                      )}
                      <span className="flex flex-col">
                        <span className="font-semibold">{b.title}</span>
                        <span className="text-sm text-muted">
                          {b.author}
                          {b.published_year ? ` · ${b.published_year}` : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.cards.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-semibold">{t.search.cards}</h2>
              <CardGrid cards={results.cards} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
