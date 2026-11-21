import { NextResponse } from "next/server";
import { requireApiUser, serverError } from "@/lib/api";

/** GDPR-style export of everything the app stores about the user. */
export async function GET() {
  const auth = await requireApiUser();
  if (!auth.ok) return auth.response;
  const { supabase, user } = auth;
  const [profile, stashes, reviews, views] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("stashes").select("card_id, note, created_at, cards(title, language)").eq("user_id", user.id),
    supabase.from("card_reviews").select("*").eq("user_id", user.id),
    supabase.from("card_views").select("card_id, action, created_at").eq("user_id", user.id).order("created_at"),
  ]);
  const failed = [profile, stashes, reviews, views].find((r) => r.error);
  if (failed?.error) return serverError("export", failed.error);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile: profile.data,
    stashes: stashes.data,
    reviews: reviews.data,
    views: views.data,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="stash-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
