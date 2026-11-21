"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useT } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase/client";

type Props = { next: string; initialMode: "signin" | "signup"; authError: boolean };

export function LoginForm({ next, initialMode, authError }: Props) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "info"; text: string } | null>(
    authError ? { kind: "error", text: t.common.error } : null,
  );

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callbackUrl(), data: { language: locale } },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage({ kind: "info", text: t.auth.checkEmail });
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage({ kind: "error", text: t.auth.invalid });
          return;
        }
      }
      router.replace(next);
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : t.common.error });
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setPending(true);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
    if (error) {
      setMessage({ kind: "error", text: error.message });
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
      <h1 className="font-serif text-3xl font-bold">{mode === "signup" ? t.auth.signUpTitle : t.auth.signInTitle}</h1>

      <button type="button" className="btn-ghost w-full py-3" onClick={onGoogle} disabled={pending}>
        <span aria-hidden="true" className="font-bold">
          G
        </span>
        {t.auth.google}
      </button>

      <div className="flex items-center gap-3 text-sm text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        {t.auth.or}
        <span className="h-px flex-1 bg-line" />
      </div>

      <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t.auth.email}
          <input
            className="input"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t.auth.password}
          <input
            className="input"
            type="password"
            name="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="password-hint"
          />
          <span id="password-hint" className="text-xs font-normal text-muted">
            {t.auth.passwordHint}
          </span>
        </label>

        {message && (
          <p role={message.kind === "error" ? "alert" : "status"} className={message.kind === "error" ? "text-sm text-danger" : "text-sm text-ok"}>
            {message.text}
          </p>
        )}

        <button type="submit" className="btn-primary py-3" disabled={pending}>
          {mode === "signup" ? t.auth.signUp : t.auth.signIn}
        </button>
      </form>

      <button
        type="button"
        className="text-sm text-muted underline underline-offset-4 hover:text-ink"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setMessage(null);
        }}
      >
        {mode === "signup" ? t.auth.switchToSignIn : t.auth.switchToSignUp}
      </button>
    </div>
  );
}
