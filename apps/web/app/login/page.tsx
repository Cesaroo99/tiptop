"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Modal, PrimaryButton, TextInput } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { messages } = useI18n();
  const router = useRouter();
  const [phone, setPhone] = useState("+237 695 21 47 85");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauth, setOauth] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ phone, country: "CM" }),
      });
      sessionStorage.setItem("tiptop_phone", phone);
      sessionStorage.setItem("tiptop_remember", remember ? "1" : "0");
      router.push("/otp");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 429 || String(err.code).includes("COOLDOWN"))) {
        sessionStorage.setItem("tiptop_phone", phone);
        sessionStorage.setItem("tiptop_remember", remember ? "1" : "0");
        router.push("/otp");
        return;
      }
      if (err instanceof ApiError && err.code.includes("INVALID_PHONE")) {
        setError(messages.auth.invalidPhone);
      } else {
        setError(messages.auth.networkError);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-10">
      <div className="mb-10 flex justify-center">
        <Logo size={48} />
      </div>
      <h1 className="text-center text-2xl font-bold text-ink">{messages.auth.welcome}</h1>
      <p className="mt-2 text-center text-muted">{messages.auth.connect}</p>
      <form onSubmit={submit} className="mt-10 space-y-6">
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--bg)] px-3 py-2 ring-1 ring-[var(--border)]">
          <span className="text-xl" aria-hidden>
            🇨🇲
          </span>
          <TextInput
            aria-label={messages.account.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border-0 bg-transparent px-0 py-3"
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="h-4 w-4 accent-[var(--accent)]"
          />
          {messages.auth.rememberMe}
        </label>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <PrimaryButton type="submit" loading={loading}>
          {messages.auth.login}
        </PrimaryButton>
      </form>
      <p className="mt-8 text-center text-sm text-muted">{messages.auth.orContinue}</p>
      <div className="mt-4 flex justify-center gap-4">
        <button type="button" onClick={() => setOauth(true)} className="grid h-14 w-14 place-items-center rounded-2xl bg-surface shadow-card" aria-label="Google">
          <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.4 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.1 0 9.8-1.9 13.3-5.1l-6.1-5.2C29.2 35.9 26.8 37 24 37c-5.2 0-9.6-3.5-11.2-8.3l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.4 6.7l6.1 5.2C37.5 37.8 44 32 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
        </button>
        <button type="button" onClick={() => setOauth(true)} className="grid h-14 w-14 place-items-center rounded-2xl bg-surface shadow-card" aria-label="Facebook">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2"><path d="M22 12.1C22 6.5 17.5 2 12 2S2 6.5 2 12.1c0 5 3.7 9.1 8.4 9.9v-7H8.1v-2.9h2.3V9.9c0-2.3 1.4-3.6 3.5-3.6 1 0 2 .2 2 .2v2.2h-1.1c-1.1 0-1.5.7-1.5 1.4v1.7h2.6l-.4 2.9h-2.2v7C18.3 21.2 22 17 22 12.1z"/></svg>
        </button>
        <button type="button" onClick={() => setOauth(true)} className="grid h-14 w-14 place-items-center rounded-2xl bg-surface shadow-card" aria-label="Apple">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.3-1.6 2.7-.4 6.8 1.1 9 .8 1.1 1.7 2.3 2.9 2.3 1.1 0 1.6-.8 3-.8s1.8.8 3 .8c1.2 0 2-.1 2.9-2.3.7-1 1.2-2 1.5-3.1-1.8-.7-2-3.1-2-3.8zM14.6 6.3c.6-.8 1.1-1.9.9-3-1 .1-2.2.7-2.9 1.5-.6.7-1.2 1.8-.9 2.9 1.1.1 2.2-.6 2.9-1.4z"/></svg>
        </button>
      </div>
      <Modal open={oauth} title={messages.auth.oauthSoon} onClose={() => setOauth(false)}>
        {messages.auth.oauthSoonBody}
      </Modal>
    </main>
  );
}
