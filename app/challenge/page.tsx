import type { Metadata } from "next";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer, requireOnboardedUser } from "@/lib/session";
import { DailyChallenge } from "./DailyChallenge";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).challenge.title };
}

export default async function ChallengePage() {
  const { locale } = await requireOnboardedUser("/challenge");
  const t = messagesFor(locale);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">{t.challenge.title}</h1>
        <p className="text-muted">{t.challenge.subtitle}</p>
      </div>
      <DailyChallenge />
    </div>
  );
}
