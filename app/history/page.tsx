import type { Metadata } from "next";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer, requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { HistoryList, type CategoryNode, type ProgressRow } from "./HistoryList";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).history.title };
}

export default async function HistoryPage() {
  const { locale } = await requireOnboardedUser("/history");
  const t = messagesFor(locale);
  const supabase = await createClient();
  const [categories, progress] = await Promise.all([
    supabase.from("categories").select("id, name_fr, name_en, icon, parent_id").order("sort_order"),
    supabase.rpc("category_progress"),
  ]);
  if (categories.error) throw new Error(categories.error.message);
  if (progress.error) throw new Error(progress.error.message);

  const tree: CategoryNode[] = categories.data
    .filter((c) => c.parent_id === null)
    .map((main) => ({
      id: main.id,
      name_fr: main.name_fr,
      name_en: main.name_en,
      icon: main.icon,
      children: categories.data.filter((c) => c.parent_id === main.id).map((c) => ({ id: c.id, name_fr: c.name_fr, name_en: c.name_en })),
    }));
  const rows: ProgressRow[] = progress.data.map((r) => ({
    category_id: r.category_id,
    name_fr: r.name_fr,
    name_en: r.name_en,
    icon: r.icon,
    seen: Number(r.seen),
    total: Number(r.total),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">{t.history.title}</h1>
        <p className="text-muted">{t.history.subtitle}</p>
      </div>
      <HistoryList tree={tree} progress={rows} />
    </div>
  );
}
