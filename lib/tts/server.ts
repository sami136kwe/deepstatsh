import "server-only";
import { Communicate } from "edge-tts-universal";
import { AudioCache } from "./cache";
import { TtsUpstreamError } from "./errors";
import { synthesizeKokoro } from "./kokoro";
import { isKokoroVoice } from "./voices";

export { TtsUpstreamError } from "./errors";

type Cached = { audio: Buffer; type: string };

// Survives across requests within one server instance (module scope).
const cache = new AudioCache(24 * 1024 * 1024);
const types = new Map<string, string>();

/** Give up quickly so the browser can fall back to its own voice. */
const EDGE_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`speech service timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function synthesizeEdge(text: string, voice: string): Promise<Buffer> {
  const collect = async () => {
    const chunks: Buffer[] = [];
    for await (const chunk of new Communicate(text, { voice, connectionTimeout: 8000 }).stream()) {
      if (chunk.type === "audio" && chunk.data) chunks.push(Buffer.from(chunk.data));
    }
    return Buffer.concat(chunks);
  };
  try {
    return await withTimeout(collect(), EDGE_TIMEOUT_MS);
  } catch (cause) {
    throw new TtsUpstreamError("speech service failed", { cause });
  }
}

/** Synthesizes `text` with an Edge neural voice or the local Kokoro server (cached). */
export async function synthesize(text: string, voice: string): Promise<Cached & { cached: boolean }> {
  const key = `${voice}|${text}`;
  const hit = cache.get(key);
  if (hit) return { audio: hit, type: types.get(key) ?? "audio/mpeg", cached: true };

  const kokoro = isKokoroVoice(voice);
  const audio = kokoro ? await synthesizeKokoro(text, voice) : await synthesizeEdge(text, voice);
  if (audio.length === 0) throw new TtsUpstreamError("empty audio");
  const type = kokoro ? "audio/wav" : "audio/mpeg";
  cache.set(key, audio);
  types.set(key, type);
  if (types.size > 400) types.delete(types.keys().next().value!);
  return { audio, type, cached: false };
}
