/**
 * Small HTTP toolkit for the ingestion pipeline: per-host rate limiting,
 * retries with exponential backoff and jitter, timeouts, and a call budget.
 */

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class BudgetExceededError extends Error {
  constructor(message = "model call budget exhausted for this run") {
    super(message);
    this.name = "BudgetExceededError";
  }
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Exponential backoff with full jitter: random in [0, base * 2^attempt], capped. */
export function backoffDelay(attempt: number, baseMs = 500, maxMs = 30_000, random = Math.random): number {
  const ceiling = Math.min(maxMs, baseMs * 2 ** attempt);
  return Math.round(random() * ceiling);
}

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

export type RetryOptions = {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
  shouldRetry?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
};

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 4, baseMs = 500, maxMs = 30_000 } = options;
  const shouldRetry =
    options.shouldRetry ??
    ((error: unknown) =>
      error instanceof HttpError ? isRetryableStatus(error.status) : !(error instanceof BudgetExceededError));
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !shouldRetry(error)) throw error;
      const delay = backoffDelay(attempt, baseMs, maxMs);
      options.onRetry?.(error, attempt + 1, delay);
      await sleep(delay);
      attempt += 1;
    }
  }
}

/** Guarantees a minimum interval between calls sharing the same key. */
export class RateLimiter {
  private next = new Map<string, number>();
  constructor(private readonly minIntervalMs: Record<string, number>, private readonly fallbackMs = 250) {}

  async wait(key: string): Promise<void> {
    const interval = this.minIntervalMs[key] ?? this.fallbackMs;
    const now = Date.now();
    const at = Math.max(now, this.next.get(key) ?? 0);
    this.next.set(key, at + interval);
    if (at > now) await sleep(at - now);
  }
}

export const defaultLimiter = new RateLimiter({
  "www.googleapis.com": 400,
  "openlibrary.org": 1100,
  "en.wikipedia.org": 200,
  "fr.wikipedia.org": 200,
  "en.wikiquote.org": 200,
  "fr.wikiquote.org": 200,
});

/** Counts model calls and refuses new ones once the cap is reached. */
export class CallBudget {
  private used = 0;
  constructor(public readonly max: number) {}
  take(): void {
    if (this.used >= this.max) throw new BudgetExceededError();
    this.used += 1;
  }
  get count(): number {
    return this.used;
  }
  get remaining(): number {
    return Math.max(0, this.max - this.used);
  }
}

export type FetchJsonOptions = {
  userAgent: string;
  limiter?: RateLimiter;
  timeoutMs?: number;
  retries?: number;
  headers?: Record<string, string>;
  method?: "GET" | "POST";
  body?: string;
};

export async function fetchJson<T>(url: string, options: FetchJsonOptions): Promise<T> {
  const host = new URL(url).host;
  const limiter = options.limiter ?? defaultLimiter;
  return withRetry(
    async () => {
      await limiter.wait(host);
      const res = await fetch(url, {
        method: options.method ?? "GET",
        body: options.body,
        headers: { Accept: "application/json", "User-Agent": options.userAgent, ...options.headers },
        signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new HttpError(res.status, url, `${res.status} ${res.statusText} for ${host}: ${text.slice(0, 200)}`);
      }
      return (await res.json()) as T;
    },
    { retries: options.retries ?? 3 },
  );
}
