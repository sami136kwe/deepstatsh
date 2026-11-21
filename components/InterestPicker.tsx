"use client";

import type { MainCategory } from "@/lib/categories";
import type { Locale } from "@/lib/i18n/messages";

type Props = {
  categories: MainCategory[];
  selected: string[];
  onChange: (ids: string[]) => void;
  locale: Locale;
  legend: string;
};

export function InterestPicker({ categories, selected, onChange, locale, legend }: Props) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  return (
    <fieldset>
      <legend className="sr-only">{legend}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {categories.map((c) => {
          const checked = selected.includes(c.id);
          return (
            <label
              key={c.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                checked ? "border-accent bg-accent-soft" : "border-line bg-surface hover:bg-surface-2"
              }`}
            >
              <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--accent)]" checked={checked} onChange={() => toggle(c.id)} />
              <span className="flex flex-col">
                <span className="font-semibold">
                  <span aria-hidden="true">{c.icon} </span>
                  {locale === "fr" ? c.name_fr : c.name_en}
                </span>
                <span className="text-sm text-muted">{locale === "fr" ? c.description : c.description_en}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
