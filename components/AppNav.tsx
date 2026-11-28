"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { CompassIcon, HomeIcon, LibraryIcon, UserIcon } from "./Icons";
import { ThemeToggle } from "./ThemeToggle";

type Props = { signedIn: boolean; isAdmin: boolean; hasSession?: boolean };

function useLinks() {
  const t = useT();
  return [
    { href: "/home", label: t.lib.home, Icon: HomeIcon },
    { href: "/explore", label: t.lib.explore, Icon: CompassIcon },
    { href: "/library", label: t.lib.library, Icon: LibraryIcon },
    { href: "/profile", label: t.lib.profile, Icon: UserIcon },
  ];
}

export function AppHeader({ signedIn, hasSession = signedIn }: Props) {
  const t = useT();
  const pathname = usePathname();
  const links = useLinks();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        {t.nav.skip}
      </a>
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <Link href={signedIn ? "/home" : "/"} className="font-serif text-xl font-bold tracking-tight">
          {t.appName}
          <span className="text-accent">.</span>
        </Link>
        {signedIn && (
          <nav aria-label={t.nav.main} className="ml-4 hidden items-center gap-1 md:flex">
            {links.map((l) => (
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
          <ThemeToggle />
          {hasSession ? (
            <form action="/auth/signout" method="post">
              <button type="submit" className={`${signedIn ? "hidden md:block" : ""} rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink`}>
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

export function BottomNav({ signedIn }: Props) {
  const t = useT();
  const pathname = usePathname();
  const items = useLinks();
  if (!signedIn) return null;
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
                <l.Icon className="h-6 w-6" />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
