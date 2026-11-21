import "server-only";
import { cookies, headers } from "next/headers";
import { isLocale, MESSAGES, type Locale, type Messages } from "./messages";

export const LOCALE_COOKIE = "lang";

/** Locale for this request: profile language, then cookie, then Accept-Language. */
export async function resolveLocale(profileLanguage?: string | null): Promise<Locale> {
  if (isLocale(profileLanguage)) return profileLanguage;
  const cookie = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(cookie)) return cookie;
  const accept = (await headers()).get("accept-language") ?? "";
  return /^\s*en\b/i.test(accept) ? "en" : "fr";
}

export function messagesFor(locale: Locale): Messages {
  return MESSAGES[locale];
}
