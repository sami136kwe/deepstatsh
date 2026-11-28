import type { Metadata, Viewport } from "next";
import { AppHeader, BottomNav } from "@/components/AppNav";
import { THEME_SCRIPT } from "@/components/ThemeToggle";
import { I18nProvider } from "@/lib/i18n/client";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer } from "@/lib/session";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getViewer();
  const t = messagesFor(locale);
  return {
    title: { default: `${t.appName} · ${t.tagline}`, template: `%s · ${t.appName}` },
    description: t.landing.subtitle,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1017",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, locale, isAdmin, profile } = await getViewer();
  const signedIn = !!user && !!profile?.onboarded;
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <I18nProvider locale={locale}>
          <AppHeader signedIn={signedIn} isAdmin={isAdmin} hasSession={!!user} />
          <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-4 md:pb-10">
            {children}
          </main>
          <BottomNav signedIn={signedIn} isAdmin={isAdmin} />
        </I18nProvider>
      </body>
    </html>
  );
}
