"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client/api";
import { useT } from "@/lib/i18n/client";

export type ReviewCard = {
  id: string;
  translationId: string;
  title: string;
  body: string;
  action_step: string;
  language: string;
  status: string;
  quality_score: number | null;
  style_score: number | null;
  rejection_reason: string | null;
};

export function AdminReview({ cards }: { cards: ReviewCard[] }) {
  const t = useT();
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  if (cards.length === 0) return <p className="text-muted">{t.admin.empty}</p>;

  async function decide(id: string, status: "published" | "rejected") {
    const previous = statuses[id];
    setStatuses((s) => ({ ...s, [id]: status }));
    try {
      await apiFetch("/api/admin/cards", { method: "PATCH", json: { cardId: id, status } });
    } catch {
      setStatuses((s) => ({ ...s, [id]: previous ?? "" }));
    }
  }

  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {cards.map((card) => {
        const status = statuses[card.id] || card.status;
        return (
          <li key={card.translationId} className="card-surface flex flex-col gap-2 p-4 text-sm" lang={card.language}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip uppercase">{card.language}</span>
              <span className={`chip ${status === "published" ? "text-ok" : status === "rejected" ? "text-danger" : ""}`}>{status}</span>
              <span className="chip">
                {t.admin.scores}: {card.quality_score ?? "–"} / {card.style_score ?? "–"}
              </span>
            </div>
            <h3 className="font-serif text-lg font-bold">{card.title}</h3>
            <p>{card.body}</p>
            <p className="rounded-xl bg-accent-soft p-2 font-medium">{card.action_step}</p>
            {card.rejection_reason && (
              <p className="text-xs text-muted">
                {t.admin.reason}: {card.rejection_reason}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" className="btn-ghost py-1.5" disabled={status === "published"} onClick={() => decide(card.id, "published")}>
                {t.admin.approve}
              </button>
              <button type="button" className="btn-danger py-1.5" disabled={status === "rejected"} onClick={() => decide(card.id, "rejected")}>
                {t.admin.reject}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function RerunForm({ categories }: { categories: { id: string; label: string }[] }) {
  const t = useT();
  const router = useRouter();
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [state, setState] = useState<{ kind: "idle" | "running" | "done" | "error"; text?: string }>({ kind: "idle" });

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "running" });
        try {
          const res = await apiFetch<{ status: string; cardsCreated: number; cardsRejected: number; booksFound: number }>("/api/admin/rerun", {
            method: "POST",
            json: { categoryId },
          });
          setState({ kind: "done", text: `${t.admin.rerunStarted}: ${res.status} · +${res.booksFound} / ${res.cardsCreated} / ${res.cardsRejected}` });
          router.refresh();
        } catch (error) {
          setState({ kind: "error", text: error instanceof Error ? error.message : t.common.error });
        }
      }}
    >
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t.admin.rerunCategory}
        <select className="input font-normal sm:w-72" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-primary" disabled={state.kind === "running" || !categoryId}>
        {state.kind === "running" ? "…" : t.admin.rerun}
      </button>
      <span role="status" className={`text-sm ${state.kind === "error" ? "text-danger" : "text-muted"}`}>
        {state.text}
      </span>
    </form>
  );
}
