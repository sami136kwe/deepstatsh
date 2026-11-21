"use client";

import { useState } from "react";
import { apiFetch, localDay } from "@/lib/client/api";
import { useT } from "@/lib/i18n/client";

export function StashButton({ cardId, initiallyStashed }: { cardId: string; initiallyStashed: boolean }) {
  const t = useT();
  const [stashed, setStashed] = useState(initiallyStashed);
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      className={stashed ? "btn-ghost self-start text-accent" : "btn-primary self-start"}
      aria-pressed={stashed}
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          if (stashed) await apiFetch("/api/stash", { method: "DELETE", json: { cardId } });
          else await apiFetch("/api/stash", { method: "POST", json: { cardId, day: localDay() } });
          setStashed(!stashed);
        } finally {
          setPending(false);
        }
      }}
    >
      ★ {stashed ? t.feed.stashed : t.feed.stash}
    </button>
  );
}
