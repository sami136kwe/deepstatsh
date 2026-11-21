import { NextResponse } from "next/server";
import { jsonError, parseJson, requireApiAdmin, serverError } from "@/lib/api";
import { ConfigurationError } from "@/lib/ingestion/deps";
import { runIngestion } from "@/lib/ingestion/run";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminRerunBodySchema } from "@/lib/validation/api";

export const maxDuration = 300;

/** Re-runs the pipeline for one main category. */
export async function POST(request: Request) {
  const auth = await requireApiAdmin();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, adminRerunBodySchema);
  if (!body.ok) return body.response;

  const { data: category } = await createAdminClient()
    .from("categories")
    .select("id")
    .eq("id", body.data.categoryId)
    .is("parent_id", null)
    .maybeSingle();
  if (!category) return jsonError(404, "category_not_found");

  try {
    const summary = await runIngestion("admin", [category.id]);
    return NextResponse.json({
      runId: summary.runId,
      status: summary.status,
      booksFound: summary.booksFound,
      cardsCreated: summary.cardsCreated,
      cardsRejected: summary.cardsRejected,
      modelCalls: summary.modelCalls,
    });
  } catch (error) {
    if (error instanceof ConfigurationError) return jsonError(503, "not_configured", error.message);
    return serverError("admin:rerun", error);
  }
}
