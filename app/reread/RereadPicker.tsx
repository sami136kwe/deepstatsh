"use client";

import { useState } from "react";
import { Feed, type RereadMode } from "@/app/feed/Feed";
import type { MainCategory } from "@/lib/categories";
import { useLocale, useT } from "@/lib/i18n/client";

const MODES: RereadMode[] = ["random", "oldest", "least", "stashed"];

export function RereadPicker({ categories, dailyGoal }: { categories: MainCategory[]; dailyGoal: number }) {
  const t = useT();
  const locale = useLocale();
  const [mode, setMode] = useState<RereadMode>("random");
  const [category, setCategory] = useState("");
  const [started, setStarted] = useState<{ mode: RereadMode; category?: string } | null>(null);

  if (started) {
    return (
      <div className="flex flex-col gap-4">
        <button type="button" className="btn-ghost self-start" onClick={() => setStarted(null)}>
          ← {t.reread.change}
        </button>
        <Feed key={`${started.mode}-${started.category ?? "all"}`} dailyGoal={dailyGoal} mode="reread" rereadQuery={started} />
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setStarted({ mode, category: category || undefined });
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t.reread.mode}</legend>
        {MODES.map((m) => (
          <label
            key={m}
            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${mode === m ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2"}`}
          >
            <input type="radio" name="mode" className="h-4 w-4 accent-[var(--accent)]" checked={mode === m} onChange={() => setMode(m)} />
            {t.reread.modes[m]}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        {t.reread.category}
        <select className="input font-normal" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t.reread.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {locale === "fr" ? c.name_fr : c.name_en}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" className="btn-primary self-start px-6 py-3">
        {t.reread.start}
      </button>
    </form>
  );
}
