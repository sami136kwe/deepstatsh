"use client";

import { ReviewLaterButton } from "@/components/ReviewLaterButton";
import { useT } from "@/lib/i18n/client";

/** Read count and "review later" for a card the user has already read. */
export function ReadMeta({ cardId, readCount }: { cardId: string; readCount: number }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="chip">{t.cardState.readCount(readCount)}</span>
      <ReviewLaterButton cardId={cardId} />
    </div>
  );
}
