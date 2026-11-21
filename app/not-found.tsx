import Link from "next/link";
import { messagesFor } from "@/lib/i18n/server";
import { getViewer } from "@/lib/session";

export default async function NotFound() {
  const { locale } = await getViewer();
  const t = messagesFor(locale);
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="font-serif text-5xl font-bold">404</p>
      <p className="text-muted">{t.errors.notFound}</p>
      <Link href="/" className="btn-ghost">
        {t.common.back}
      </Link>
    </div>
  );
}
