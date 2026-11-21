import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { jsonError, serverError } from "@/lib/api";
import { serverEnv } from "@/lib/env";
import { ConfigurationError } from "@/lib/ingestion/deps";
import { runIngestion } from "@/lib/ingestion/run";

// Vercel Hobby allows up to 300 s per function; the pipeline stops starting new books before that.
export const maxDuration = 300;

function authorized(request: Request, secret: string | undefined): boolean {
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(header);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Daily ingestion, called by Vercel Cron (or pg_cron) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: Request) {
  if (!authorized(request, serverEnv().CRON_SECRET)) return jsonError(401, "unauthorized");
  try {
    const summary = await runIngestion("cron");
    return NextResponse.json({
      runId: summary.runId,
      status: summary.status,
      booksFound: summary.booksFound,
      cardsCreated: summary.cardsCreated,
      cardsRejected: summary.cardsRejected,
      modelCalls: summary.modelCalls,
      errors: summary.errors.length,
    });
  } catch (error) {
    if (error instanceof ConfigurationError) return jsonError(503, "not_configured", error.message);
    return serverError("cron:ingest", error);
  }
}
