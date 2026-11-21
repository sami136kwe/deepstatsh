import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jsonError, parseJson, requireApiUser, serverError } from "@/lib/api";
import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { profileBodySchema } from "@/lib/validation/api";

export async function PATCH(request: Request) {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const body = await parseJson(request, profileBodySchema);
  if (!body.ok) return body.response;
  const update = body.data;

  if (update.interests) {
    // Interests must be existing main categories.
    const { data: mains, error } = await auth.supabase
      .from("categories")
      .select("id")
      .is("parent_id", null)
      .in("id", update.interests);
    if (error) return serverError("profile:categories", error);
    if (mains.length !== new Set(update.interests).size) return jsonError(400, "unknown_category");
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update(update)
    .eq("id", auth.user.id)
    .select("*")
    .single();
  if (error) return serverError("profile:update", error);
  if (update.language) {
    (await cookies()).set(LOCALE_COOKIE, update.language, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return NextResponse.json({ profile: data });
}
