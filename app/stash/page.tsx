import type { Metadata } from "next";
import { cardsByIds } from "@/lib/cards";
import { mainCategories } from "@/lib/categories";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer, requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StashList } from "./StashList";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).stash.title };
}

export default async function StashPage() {
  const { user, locale } = await requireOnboardedUser("/stash");
  const supabase = await createClient();
  const { data: stashes, error } = await supabase
    .from("stashes")
    .select("card_id, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const [cards, categories] = await Promise.all([cardsByIds(supabase, stashes.map((s) => s.card_id)), mainCategories(supabase)]);
  const notes = Object.fromEntries(stashes.map((s) => [s.card_id, s.note ?? ""]));
  const t = messagesFor(locale);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-serif text-3xl font-bold">{t.stash.title}</h1>
      <StashList initialCards={cards} initialNotes={notes} categories={categories} />
    </div>
  );
}
