import type { Metadata } from "next";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer, requireOnboardedUser } from "@/lib/session";
import { Feed } from "./Feed";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).feed.title };
}

export default async function FeedPage() {
  const { profile } = await requireOnboardedUser("/feed");
  return <Feed dailyGoal={profile.daily_goal} />;
}
