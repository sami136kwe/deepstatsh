import Link from "next/link";
import type { BookItem } from "@/lib/books";
import { BookCover } from "./BookCover";

/** A book in a shelf: cover, title, author and optionally a progress bar. */
export function BookTile({ book, done, size = "md" }: { book: BookItem; done?: number; size?: "sm" | "md" | "lg" }) {
  const total = book.idea_count;
  return (
    <Link href={`/books/${book.id}`} style={{ width: size === "lg" ? "13rem" : size === "sm" ? "8rem" : "10rem" }} className="group flex shrink-0 flex-col gap-2" data-testid="book-tile">
      <BookCover title={book.title} author={book.author} coverUrl={book.cover_url} seed={book.slug ?? book.id} size={size} />
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-accent">{book.title}</span>
        <span className="line-clamp-1 text-xs text-muted">{book.author}</span>
      </div>
      {done !== undefined && total > 0 && (
        <div className="h-1 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
          <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round((done / total) * 100)}%` }} />
        </div>
      )}
    </Link>
  );
}

export function Shelf({ title, href, seeAll, children }: { title: string; href?: string; seeAll?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {href && seeAll && (
          <Link href={href} className="text-sm font-medium text-accent">
            {seeAll}
          </Link>
        )}
      </div>
      <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">{children}</div>
    </section>
  );
}
