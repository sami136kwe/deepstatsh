"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/client/api";
import { useT } from "@/lib/i18n/client";

/** "Revoir plus tard": puts the card back in the spaced-repetition queue, due now. */
export function ReviewLaterButton({ cardId }: { cardId: string }) {
  const t = useT();
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  return (
    <button
      type="button"
      className="btn-ghost py-1.5"
      disabled={state === "saving" || state === "done"}
      onClick={async () => {
        setState("saving");
        try {
          await apiFetch("/api/review/later", { method: "POST", json: { cardId } });
          setState("done");
        } catch {
          setState("error");
        }
      }}
    >
      <span aria-hidden="true">{state === "done" ? "✓" : "↻"}</span>
      {state === "done" ? t.cardState.queued : state === "error" ? t.common.error : t.cardState.reviewLater}
    </button>
  );
}
