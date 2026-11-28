import Link from "next/link";
import { redirect } from "next/navigation";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer } from "@/lib/session";

export default async function LandingPage() {
  const { user, profile, locale } = await getViewer();
  if (user) redirect(profile?.onboarded ? "/home" : "/onboarding");
  const t = messagesFor(locale);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 py-10 sm:py-16">
      <section className="flex flex-col gap-6">
        <p className="chip w-fit">{t.tagline}</p>
        <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight sm:text-5xl">{t.landing.title}</h1>
        <p className="text-lg leading-relaxed text-muted">{t.landing.subtitle}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/login?mode=signup" className="btn-primary px-6 py-3 text-base">
            {t.landing.cta}
          </Link>
          <Link href="/login" className="btn-ghost px-6 py-3 text-base">
            {t.landing.haveAccount}
          </Link>
        </div>
      </section>
      <ul className="grid gap-3 sm:grid-cols-3">
        {t.landing.points.map((point) => (
          <li key={point} className="card-surface p-5 text-sm leading-relaxed">
            {point}
          </li>
        ))}
      </ul>
    </div>
  );
}
