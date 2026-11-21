import type { Metadata } from "next";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer, requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).progress.title };
}

export default async function ProgressPage() {
  const { profile, locale } = await requireOnboardedUser("/progress");
  const t = messagesFor(locale);
  const supabase = await createClient();
  const { data: rows, error } = await supabase.rpc("category_progress");
  if (error) throw new Error(error.message);
  const interests = new Set(profile.interests);
  const sorted = [...rows].sort((a, b) => Number(interests.has(b.category_id)) - Number(interests.has(a.category_id)));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-3xl font-bold">{t.progress.title}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card-surface p-6">
          <p className="text-sm font-medium text-muted">{t.progress.streak}</p>
          <p className="mt-1 font-serif text-4xl font-bold">🔥 {t.progress.days(profile.streak_count)}</p>
        </div>
        <div className="card-surface p-6">
          <p className="text-sm font-medium text-muted">{t.progress.longest}</p>
          <p className="mt-1 font-serif text-4xl font-bold">{t.progress.days(profile.longest_streak)}</p>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t.progress.byCategory}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {sorted.map((row) => {
            const total = Number(row.total);
            const seen = Number(row.seen);
            const pct = total > 0 ? Math.round((seen / total) * 100) : 0;
            return (
              <li key={row.category_id} className="card-surface flex flex-col gap-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">
                    <span aria-hidden="true">{row.icon} </span>
                    {locale === "fr" ? row.name_fr : row.name_en}
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-sm text-muted">{pct} %</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={seen} aria-label={t.progress.seenOf(seen, total)}>
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-sm text-muted">
                  {t.progress.seenOf(seen, total)} · {t.progress.stashedCount(Number(row.stashed))} · {t.progress.completedCount(Number(row.completed))}
                </p>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
