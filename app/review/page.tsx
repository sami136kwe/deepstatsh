import type { Metadata } from "next";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer, requireOnboardedUser } from "@/lib/session";
import { ReviewSession } from "./ReviewSession";

export async function generateMetadata(): Promise<Metadata> {
  return { title: messagesFor((await getViewer()).locale).review.title };
}

export default async function ReviewPage() {
  const { locale } = await requireOnboardedUser("/review");
  const t = messagesFor(locale);
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-serif text-3xl font-bold">{t.review.title}</h1>
        <p className="text-muted">{t.review.subtitle}</p>
      </div>
      <ReviewSession />
    </div>
  );
}
