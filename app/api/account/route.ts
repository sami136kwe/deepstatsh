import { NextResponse } from "next/server";
import { requireApiUser, serverError } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

/** Deletes the auth user; every user table cascades from auth.users. */
export async function DELETE() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(auth.user.id);
  if (error) return serverError("account:delete", error);
  await auth.supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
