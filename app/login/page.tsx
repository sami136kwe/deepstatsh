import { redirect } from "next/navigation";
import { getViewer } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; mode?: string; error?: string }> }) {
  const params = await searchParams;
  const { user, profile } = await getViewer();
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/home";
  if (user) redirect(profile?.onboarded ? next : "/onboarding");
  return <LoginForm next={next} initialMode={params.mode === "signup" ? "signup" : "signin"} authError={params.error === "auth"} />;
}
