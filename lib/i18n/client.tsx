"use client";

import { createContext, useContext } from "react";
import { MESSAGES, type Locale, type Messages } from "./messages";

const LocaleContext = createContext<Locale>("fr");

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT(): Messages {
  return MESSAGES[useContext(LocaleContext)];
}
