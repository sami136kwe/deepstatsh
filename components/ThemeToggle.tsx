"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/client";

type Theme = "system" | "light" | "dark";
const KEY = "theme";
const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function applyTheme(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the choice simply won't persist.
  }
  applyTheme(theme);
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, readTheme, () => "system");
}

function subscribeResolved(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    if (readTheme() === "system") applyTheme("system");
    listener();
  };
  media.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onSystemChange);
  };
}

/** Whether dark mode is currently displayed (explicit choice or system preference). */
export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribeResolved,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}

/** Inline script run before first paint to avoid a flash of the wrong theme. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;

export function ThemeToggle() {
  const t = useT();
  const isDark = useIsDark();
  const next: Theme = isDark ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink"
      aria-label={next === "dark" ? t.common.darkMode : t.common.lightMode}
      title={next === "dark" ? t.common.darkMode : t.common.lightMode}
    >
      <span aria-hidden="true" className="block h-5 w-5 text-center leading-5">
        {isDark ? "☀" : "☾"}
      </span>
    </button>
  );
}
