"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { ThemeToggle } from "./ThemeToggle";

type Props = { signedIn: boolean; isAdmin: boolean; hasSession?: boolean };

function useLinks(isAdmin: boolean) {
  const t = useT();
  const links = [
    { href: "/feed", label: t.nav.feed, icon: "▤" },
    { href: "/stash", label: t.nav.stash, icon: "★" },
    { href: "/review", label: t.nav.review, icon: "↻" },
    { href: "/challenge", label: t.nav.challenge, icon: "✓" },
    { href: "/progress", label: t.nav.progress, icon: "▲" },
  ];
  const secondary = [
    { href: "/search", label: t.nav.search, icon: "⌕" },
    { href: "/profile", label: t.nav.profile, icon: "◉" },
    ...(isAdmin ? [{ href: "/admin", label: t.nav.admin, icon: "⚙" }] : []),
  ];
  return { links, secondary };
}

export function AppHeader({ signedIn, isAdmin, hasSession = signedIn }: Props) {
  const t = useT();
  const pathname = usePathname();
  const { links, secondary } = useLinks(isAdmin);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        {t.nav.skip}
      </a>
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href={signedIn ? "/feed" : "/"} className="font-serif text-xl font-bold tracking-tight">
          {t.appName}
          <span className="text-accent">.</span>
        </Link>
        {signedIn && (
          <nav aria-label={t.nav.main} className="ml-4 hidden items-center gap-1 md:flex">
            {[...links, ...secondary].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  isActive(l.href) ? "bg-accent-soft text-accent" : "text-muted hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-1">
          {signedIn && (
            <Link href="/search" className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink md:hidden" aria-label={t.nav.search}>
              <span aria-hidden="true">⌕</span>
            </Link>
          )}
          <ThemeToggle />
          {hasSession ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className={`${signedIn ? "hidden sm:block" : ""} rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink`}>
                {t.nav.signOut}
              </button>
            </form>
          ) : (
            <Link href="/login" className="btn-ghost px-3 py-1.5">
              {t.nav.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ signedIn, isAdmin }: Props) {
  const t = useT();
  const pathname = usePathname();
  const { links } = useLinks(isAdmin);
  if (!signedIn) return null;
  const items = [...links.slice(0, 4), { href: "/profile", label: t.nav.profile, icon: "◉" }];
  return (
    <nav aria-label={t.nav.main} className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-md justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((l) => {
          const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <li key={l.href} className="flex-1">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active ? "text-accent" : "text-muted"}`}
              >
                <span aria-hidden="true" className="text-lg leading-none">
                  {l.icon}
                </span>
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
