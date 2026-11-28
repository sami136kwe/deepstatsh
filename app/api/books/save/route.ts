import { NextResponse } from "next/server";
import { jsonError, parseJson, requireApiUser, serverError } from "@/lib/api";
import { saveBookBodySchema } from "@/lib/validation/api";

/** Add a book to the library, or remove it. */
export async function POST(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, saveBookBodySchema);
  if (!body.ok) return body.response;
  const { error } = await auth.supabase.rpc("set_book_saved", { p_book: body.data.bookId, p_saved: body.data.saved });
  if (error) {
    if (error.code === "23503") return jsonError(404, "book_not_found");
    return serverError("books:save", error);
  }
  return NextResponse.json({ ok: true, saved: body.data.saved });
}
