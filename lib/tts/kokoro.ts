import "server-only";
import { serverEnv } from "@/lib/env";
import { TtsUpstreamError } from "./errors";

const HEALTH_TTL_MS = 15_000;
let health: { at: number; ok: boolean } | null = null;

export function kokoroUrl(): string | null {
  return serverEnv().KOKORO_URL?.replace(/\/$/, "") ?? null;
}

/** Is the local Kokoro server configured and answering? (cached for 15 s) */
export async function kokoroAvailable(): Promise<boolean> {
  const url = kokoroUrl();
  if (!url) return false;
  if (health && Date.now() - health.at < HEALTH_TTL_MS) return health.ok;
  let ok = false;
  try {
    ok = (await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) })).ok;
  } catch {
    ok = false;
  }
  health = { at: Date.now(), ok };
  return ok;
}

/** WAV bytes from the local Kokoro server for a `kokoro:<voice>` id. */
export async function synthesizeKokoro(text: string, voiceId: string): Promise<Buffer> {
  const url = kokoroUrl();
  if (!url) throw new TtsUpstreamError("KOKORO_URL is not set");
  const voice = voiceId.replace(/^kokoro:/, "");
  const language = voice.startsWith("ff_") ? "fr" : "en";
  try {
    const res = await fetch(`${url}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, language, voice }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) throw new Error(`kokoro ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (cause) {
    health = null; // re-check availability on the next call
    throw new TtsUpstreamError("kokoro request failed", { cause });
  }
}
