import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJson, requireApiUser } from "@/lib/api";
import { kokoroAvailable } from "@/lib/tts/kokoro";
import { speakable } from "@/lib/tts/segment";
import { synthesize, TtsUpstreamError } from "@/lib/tts/server";
import { isKokoroVoice, VOICE_IDS } from "@/lib/tts/voices";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  text: z.string().trim().min(1).max(900),
  voice: z.enum(VOICE_IDS),
});

/** Which engines can be used right now (tells the app whether to offer the fast local voices). */
export async function GET() {
  return NextResponse.json({ kokoro: await kokoroAvailable() });
}

/** One audio segment in, one audio file out. Signed-in users only (it spends server time). */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, bodySchema);
  if (!body.ok) return body.response;

  const text = speakable(body.data.text);
  if (!text) return jsonError(400, "empty_text");
  if (isKokoroVoice(body.data.voice) && !(await kokoroAvailable())) return jsonError(503, "kokoro_unavailable");

  const started = performance.now();
  try {
    const { audio, type, cached } = await synthesize(text, body.data.voice);
    const ms = Math.round(performance.now() - started);
    console.log(`[tts] ${body.data.voice} ${text.length} chars -> ${audio.length} bytes in ${ms} ms${cached ? " (cache)" : ""}`);
    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(audio.length),
        "Cache-Control": "private, max-age=86400",
        // Visible in the browser's Network tab (Timing) to see where the time goes.
        "Server-Timing": `synth;dur=${ms};desc="${cached ? "cache" : isKokoroVoice(body.data.voice) ? "kokoro" : "edge"}"`,
      },
    });
  } catch (error) {
    if (error instanceof TtsUpstreamError) {
      console.error(`[tts] ${body.data.voice} failed after ${Math.round(performance.now() - started)} ms:`, error.cause ?? error.message);
      return jsonError(502, "tts_unavailable");
    }
    throw error;
  }
}
