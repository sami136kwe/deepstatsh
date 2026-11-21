import type { Metadata } from "next";
import { mainCategories } from "@/lib/categories";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer, requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { RereadPicker } from "./RereadPicker";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).reread.title };
}

export default async function RereadPage() {
  const { profile, locale } = await requireOnboardedUser("/reread");
  const t = messagesFor(locale);
  const categories = await mainCategories(await createClient());
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">{t.reread.title}</h1>
        <p className="text-muted">{t.reread.subtitle}</p>
      </div>
      <RereadPicker categories={categories} dailyGoal={profile.daily_goal} />
    </div>
  );
}
