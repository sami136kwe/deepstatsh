import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminReview, RerunForm, type ReviewCard } from "./AdminClient";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const SAMPLE_SIZE = 20;
const REVIEW_FIELDS = "id, card_id, title, body, action_step, language, status, style_score, rejection_reason, created_at";

type TranslationRow = {
  id: string;
  card_id: string;
  title: string;
  body: string;
  action_step: string;
  language: string;
  status: string;
  style_score: number | null;
  rejection_reason: string | null;
  cards: { quality_score: number | null; status: string };
};

/** One review item per translation; decisions apply to the whole card. */
function toReviewCard(row: TranslationRow): ReviewCard {
  return {
    id: row.card_id,
    translationId: row.id,
    title: row.title,
    body: row.body,
    action_step: row.action_step,
    language: row.language,
    status: row.cards.status,
    quality_score: row.cards.quality_score,
    style_score: row.style_score,
    rejection_reason: row.rejection_reason,
  };
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export default async function AdminPage() {
  const { user, isAdmin, locale } = await getViewer();
  if (!user) redirect("/login?next=/admin");
  if (!isAdmin) notFound();
  const t = messagesFor(locale);
  const db = createAdminClient();

  const [runs, counts, categories, drafts] = await Promise.all([
    db.from("ingestion_runs").select("*").order("started_at", { ascending: false }).limit(15),
    db.rpc("category_card_counts"),
    db.from("categories").select("id, slug, name_fr, name_en, icon").is("parent_id", null).order("sort_order"),
    db
      .from("card_translations")
      .select(`${REVIEW_FIELDS}, cards!inner(quality_score, status)`)
      .eq("cards.status", "draft")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  for (const r of [runs, counts, categories, drafts]) if (r.error) throw new Error(r.error.message);

  const latestRun = runs.data!.find((r) => r.cards_created + r.cards_rejected > 0);
  let sample: ReviewCard[] = [];
  if (latestRun) {
    const { data, error } = await db
      .from("card_translations")
      .select(`${REVIEW_FIELDS}, cards!inner(quality_score, status, ingestion_run_id, human_reviewed)`)
      .eq("cards.ingestion_run_id", latestRun.id)
      .eq("cards.human_reviewed", false)
      .limit(400);
    if (error) throw new Error(error.message);
    sample = shuffle(data.map(toReviewCard)).slice(0, SAMPLE_SIZE);
  }

  const name = (c: { name_fr: string; name_en: string }) => (locale === "fr" ? c.name_fr : c.name_en);
  const published = (categoryId: string, language: string) =>
    counts.data!.filter((c) => c.category_id === categoryId && c.language === language && c.status === "published").reduce((s, c) => s + Number(c.total), 0);
  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" });

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-serif text-3xl font-bold">{t.admin.title}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t.admin.rerun}</h2>
        <RerunForm categories={categories.data!.map((c) => ({ id: c.id, label: `${c.icon ?? ""} ${name(c)}` }))} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t.admin.runs}</h2>
        {runs.data!.length === 0 ? (
          <p className="text-muted">{t.admin.noRuns}</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  {Object.values(t.admin.columns).map((c) => (
                    <th key={c} scope="col" className="px-3 py-2 font-semibold">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {runs.data!.map((r) => {
                  const errors = Array.isArray(r.errors) ? r.errors : [];
                  return (
                    <tr key={r.id} className="border-t border-line align-top">
                      <td className="px-3 py-2 whitespace-nowrap">{dateFmt.format(new Date(r.started_at))} UTC</td>
                      <td className="px-3 py-2">{r.source}</td>
                      <td className={`px-3 py-2 font-medium ${r.status === "failed" ? "text-danger" : r.status === "success" ? "text-ok" : ""}`}>{r.status}</td>
                      <td className="px-3 py-2">{r.books_found}</td>
                      <td className="px-3 py-2">{r.cards_created}</td>
                      <td className="px-3 py-2">{r.cards_rejected}</td>
                      <td className="px-3 py-2">{r.model_calls}</td>
                      <td className="px-3 py-2">
                        {errors.length > 0 ? (
                          <details>
                            <summary className="cursor-pointer">{errors.length}</summary>
                            <pre className="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap text-xs text-muted">{JSON.stringify(errors.slice(0, 10), null, 1)}</pre>
                          </details>
                        ) : (
                          0
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t.admin.counts}</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {categories.data!.map((c) => (
            <li key={c.id} className="card-surface flex items-center justify-between p-4 text-sm">
              <span className="font-medium">
                {c.icon} {name(c)}
              </span>
              <span className="shrink-0 whitespace-nowrap text-muted">
                FR {published(c.id, "fr")} · EN {published(c.id, "en")}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t.admin.sample}</h2>
        <AdminReview cards={sample} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">{t.admin.drafts}</h2>
        <AdminReview cards={drafts.data!.map(toReviewCard)} />
      </section>
    </div>
  );
}
