"use client";

import { useEffect } from "react";
import { useT } from "@/lib/i18n/client";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-lg text-danger">{t.common.error}</p>
      <button type="button" className="btn-ghost" onClick={reset}>
        {t.common.retry}
      </button>
    </div>
  );
}
