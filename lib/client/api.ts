"use client";

/** Local calendar day (YYYY-MM-DD) in the browser's time zone. */
export function localDay(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Local midnight as an ISO timestamp (start of the user's day). */
export function localMidnightIso(date: Date = new Date()): string {
  const midnight = new Date(date);
  midnight.setHours(0, 0, 0, 0);
  return midnight.toISOString();
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(`${status} ${code}`);
    this.name = "ApiRequestError";
  }
}

export async function apiFetch<T>(input: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(input, {
    ...rest,
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new ApiRequestError(res.status, body.error ?? "request_failed");
  }
  return (await res.json()) as T;
}
