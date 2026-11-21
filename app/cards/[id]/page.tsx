import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemoCard } from "@/components/MemoCard";
import { StashButton } from "@/components/StashButton";
import { CARD_FIELDS } from "@/lib/cards";
import { getViewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { uuidSchema } from "@/lib/validation/api";

type Params = { params: Promise<{ id: string }> };

async function loadCard(id: string) {
  if (!uuidSchema.safeParse(id).success) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("card_details").select(CARD_FIELDS).eq("id", id).eq("status", "published").maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const card = await loadCard((await params).id);
  if (!card) return {};
  return { title: card.title, description: card.action_step, openGraph: { title: card.title, description: card.body } };
}

export default async function CardPage({ params }: Params) {
  const { id } = await params;
  const card = await loadCard(id);
  if (!card) notFound();
  const { user } = await getViewer();
  let stashed = false;
  if (user) {
    const supabase = await createClient();
    const { count } = await supabase.from("stashes").select("card_id", { count: "exact", head: true }).eq("user_id", user.id).eq("card_id", id);
    stashed = (count ?? 0) > 0;
  }
  return (
    <div className="mx-auto max-w-2xl">
      <MemoCard card={card} headingLevel="h1">
        {user && <StashButton cardId={card.id} initiallyStashed={stashed} />}
      </MemoCard>
    </div>
  );
}
