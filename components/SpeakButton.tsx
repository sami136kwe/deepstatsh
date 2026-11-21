"use client";

import { useT } from "@/lib/i18n/client";
import type { PlayerState } from "@/lib/tts/player";

export function SpeakButton({ state, onToggle }: { state: PlayerState; onToggle: () => void }) {
  const t = useT();
  const active = state !== "idle";
  const label = active ? t.common.stopListening : t.common.listen;
  return (
    <button
      type="button"
      className={`btn-ghost px-3 sm:px-4 ${active ? "border-accent text-accent" : ""}`}
      onClick={onToggle}
      aria-pressed={active}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{state === "loading" ? "…" : active ? "■" : "🔊"}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
