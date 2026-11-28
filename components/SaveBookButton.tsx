"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { BookmarkIcon } from "./Icons";

export function SaveBookButton({ bookId, saved: initial }: { bookId: string; saved: boolean }) {
  const t = useT();
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const next = !saved;
    setSaved(next);
    const res = await fetch("/api/books/save", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ bookId, saved: next }) });
    if (!res.ok) setSaved(!next);
    setBusy(false);
    router.refresh();
  }

  const label = saved ? t.lib.unsaveBook : t.lib.saveBook;
  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={saved} aria-label={label} title={label} className={`btn-ghost h-11 w-11 p-0 ${saved ? "text-accent" : ""}`}>
      <BookmarkIcon className="h-5 w-5" filled={saved} />
    </button>
  );
}
