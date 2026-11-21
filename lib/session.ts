import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { adminEmails } from "@/lib/env";
import { resolveLocale } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Current user, verified against Supabase Auth (cached per request). */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data;
});

export const getViewer = cache(async () => {
  const [user, profile] = await Promise.all([getUser(), getProfile()]);
  const locale = await resolveLocale(profile?.language);
  const isAdmin = !!user?.email && adminEmails().includes(user.email.toLowerCase());
  return { user, profile, locale, isAdmin };
});

/** For pages that need a signed-in, onboarded user. */
export async function requireOnboardedUser(next: string) {
  const viewer = await getViewer();
  if (!viewer.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (!viewer.profile?.onboarded) redirect("/onboarding");
  return { ...viewer, user: viewer.user, profile: viewer.profile };
}
