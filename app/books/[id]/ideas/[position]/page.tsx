import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getBook, getIdeas, getProgress } from "@/lib/books";
import { ideaStates } from "@/lib/books-logic";
import { messagesFor } from "@/lib/i18n/server";
import { requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/api";
import { IdeaReader } from "./IdeaReader";

type Params = { params: Promise<{ id: string; position: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return {};
  const { locale } = await requireOnboardedUser(`/books/${id}`);
  const book = await getBook(await createClient(), id, locale);
  return book ? { title: book.title } : {};
}

export default async function IdeaPage({ params }: Params) {
  const { id, position: rawPosition } = await params;
  const position = Number(rawPosition);
  if (!uuidSchema.safeParse(id).success || !Number.isInteger(position) || position < 1) notFound();
  const { user, locale } = await requireOnboardedUser(`/books/${id}/ideas/${position}`);
  const supabase = await createClient();
  const book = await getBook(supabase, id, locale);
  if (!book) notFound();

  const [ideas, progress] = await Promise.all([getIdeas(supabase, id, book.language), getProgress(supabase, user.id, id)]);
  const idea = ideas.find((i) => i.position === position);
  if (!idea) redirect(`/books/${id}`);
  const states = ideaStates(ideas.map((i) => i.position), progress.completed);
  if (states.get(position) === "locked") redirect(`/books/${id}`);

  const { count: stashCount } = await supabase.from("stashes").select("card_id", { count: "exact", head: true }).eq("user_id", user.id).eq("card_id", idea.id);
  const nextIdea = ideas.find((i) => i.position > position);
  return (
    <IdeaReader
      idea={idea}
      bookId={id}
      bookTitle={book.title}
      total={ideas.length}
      stashed={(stashCount ?? 0) > 0}
      alreadyDone={progress.completed.has(position)}
      nextPosition={nextIdea?.position ?? null}
      labels={{ remember: messagesFor(locale).lib.toRemember }}
    />
  );
}
