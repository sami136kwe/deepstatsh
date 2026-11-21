import { redirect } from "next/navigation";
import { mainCategories } from "@/lib/categories";
import { getViewer } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Onboarding } from "./Onboarding";

export default async function OnboardingPage() {
  const { user, profile, locale } = await getViewer();
  if (!user) redirect("/login?next=/onboarding");
  const categories = await mainCategories(await createClient());
  return (
    <Onboarding
      categories={categories}
      initial={{
        language: profile?.language === "en" || profile?.language === "fr" ? profile.language : locale,
        interests: profile?.interests ?? [],
        dailyGoal: (profile?.daily_goal as 3 | 5 | 10 | undefined) ?? 5,
      }}
    />
  );
}
