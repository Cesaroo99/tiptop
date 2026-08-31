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
        {["G", "f", ""].map((label, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOauth(true)}
            className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-lg font-semibold shadow-card"
            aria-label={messages.auth.oauthSoon}
          >
            {label || (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 3c-1 0-2 .4-2.7 1.1A4 4 0 0 0 8 7c0 3 2 5 6 9 4-4 6-6 6-9a4 4 0 0 0-4-4Z" />
              </svg>
            )}
          </button>
        ))}
      </div>
      <Modal open={oauth} title={messages.auth.oauthSoon} onClose={() => setOauth(false)}>
        {messages.auth.oauthSoonBody}
      </Modal>
    </main>
  );
}
