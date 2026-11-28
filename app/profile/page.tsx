import type { Metadata } from "next";
import { mainCategories } from "@/lib/categories";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer, requireOnboardedUser } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ProfileForm } from "./ProfileForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).profile.title };
}

export default async function ProfilePage() {
  const { user, profile, locale } = await requireOnboardedUser("/profile");
  const t = messagesFor(locale);
  const categories = await mainCategories(await createClient());
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">{t.profile.title}</h1>
        <p className="text-muted">{user.email}</p>
      </div>
      <nav aria-label={t.lib.privateArea} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {[
          ["/stash", t.nav.stash],
          ["/review", t.nav.review],
          ["/challenge", t.nav.challenge],
          ["/progress", t.nav.progress],
          ["/history", t.nav.history],
          ["/reread", t.nav.reread],
        ].map(([href, label]) => (
          <Link key={href} href={href!} className="card-surface p-4 text-sm font-semibold hover:border-accent">
            {label}
          </Link>
        ))}
      </nav>
      <ProfileForm
        categories={categories}
        initial={{
          display_name: profile.display_name ?? "",
          language: profile.language === "en" ? "en" : "fr",
          interests: profile.interests,
          daily_goal: profile.daily_goal as 3 | 5 | 10,
        }}
      />
    </div>
  );
}
