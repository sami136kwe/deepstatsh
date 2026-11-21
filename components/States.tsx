"use client";

import { useT } from "@/lib/i18n/client";

export function Spinner({ label }: { label?: string }) {
  const t = useT();
  return (
    <div role="status" className="flex items-center justify-center gap-3 py-16 text-muted">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden="true" />
      <span>{label ?? t.common.loading}</span>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="card-surface flex flex-col items-center gap-4 px-6 py-14 text-center">
      <span aria-hidden="true" className="text-4xl">
        ✦
      </span>
      <p className="max-w-md text-lg text-muted">{title}</p>
      {children}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const t = useT();
  return (
    <div role="alert" className="card-surface flex flex-col items-center gap-4 px-6 py-12 text-center">
      <p className="text-danger">{t.common.error}</p>
      {onRetry && (
        <button type="button" className="btn-ghost" onClick={onRetry}>
          {t.common.retry}
        </button>
      )}
    </div>
  );
}
