"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, ScreenHeader } from "@/components/ui";
import { api, ApiError, storeToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function OtpPage() {
  const { messages } = useI18n();
  const { refresh } = useSession();
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [seconds, setSeconds] = useState(55);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phone = typeof window === "undefined" ? "" : sessionStorage.getItem("tiptop_phone") || "";

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const code = digits.join("");
  const masked = useMemo(() => phone.replace(/(\d{3})\d+(\d{2})/, "$1 *** *** *$2"), [phone]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 4) return;
    setLoading(true);
    setError(null);
    try {
      const remember = sessionStorage.getItem("tiptop_remember") === "1";
      const result = await api<{ token: string; user: { profileCompleted: boolean } }>("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone, code, rememberMe: remember, country: "CM" }),
      });
      storeToken(result.token, remember);
      await refresh();
      router.replace(result.user.profileCompleted ? "/" : "/onboarding");
    } catch (err) {
      const codeName = err instanceof ApiError ? err.code : "";
      if (codeName.includes("EXPIRED")) setError(messages.auth.expiredOtp);
      else if (codeName.includes("LOCKED")) setError(messages.auth.lockedOtp);
      else if (codeName.includes("invalid") || codeName.includes("INVALID")) setError(messages.auth.invalidOtp);
      else setError(messages.auth.invalidOtp);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    if (seconds > 0) return;
    await api("/auth/otp/resend", { method: "POST", body: JSON.stringify({ phone, country: "CM" }) });
    setSeconds(55);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <ScreenHeader title={messages.auth.otpTitle} onBack={() => router.push("/login")} />
      <p className="type-body-sm px-2 text-muted">{messages.auth.otpSent.replace("{phone}", masked || phone)}</p>
      <form onSubmit={verify} className="mt-8 space-y-8 px-2">
        <div className="flex justify-between gap-3">
          {digits.map((d, i) => (
            <input
              key={i}
              inputMode="numeric"
              maxLength={1}
              value={d}
              aria-label={`Digit ${i + 1}`}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(-1);
                const next = [...digits];
                next[i] = v;
                setDigits(next);
                const el = e.target.parentElement?.children[i + 1] as HTMLInputElement | undefined;
                if (v && el) el.focus();
              }}
              className={`h-16 w-16 rounded-xl border-2 bg-surface-sunken text-center type-h2 text-ink transition ${i === digits.findIndex((x) => x === "") || (i === 3 && code.length === 4) ? "border-accent" : "border-transparent"}`}
            />
          ))}
        </div>
        {seconds > 0 ? (
          <p className="type-body-sm text-muted">
            {messages.auth.resendIn.replace("{seconds}", String(seconds))}
          </p>
        ) : (
          <button type="button" className="type-body-sm font-semibold text-accent" onClick={() => void resend()}>
            {messages.auth.resend}
          </button>
        )}
        {error ? <p className="type-body-sm text-danger">{error}</p> : null}
        <PrimaryButton type="submit" loading={loading} disabled={code.length !== 4}>
          {messages.auth.verify}
        </PrimaryButton>
      </form>
    </main>
  );
}
