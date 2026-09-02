"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CardButton, ScreenHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import type { Locale } from "@tiptop/i18n";

export default function SettingsPage() {
  const { messages } = useI18n();
  const { theme, setTheme, locale, setLocale, logout, refresh } = useSession();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);
  const [prefs, setPrefs] = useState({ messages: true, social: true, events: true, invitations: true, mood: true });

  useEffect(() => {
    api<{ messages: boolean; social: boolean; events: boolean; invitations: boolean; mood: boolean }>(
      "/push/preferences",
    )
      .then(setPrefs)
      .catch(() => undefined);
  }, []);

  async function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try {
      await api("/users/me", { method: "PATCH", body: JSON.stringify({ theme: next }) });
      await refresh();
    } catch {
      /* local theme still applies */
    }
  }

  async function pickLocale(l: Locale) {
    setLocale(l);
    setLangOpen(false);
    try {
      await api("/users/me", { method: "PATCH", body: JSON.stringify({ locale: l }) });
    } catch {
      /* keep local */
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.settings.title} onBack={() => router.back()} />
      <div className="mt-4 space-y-3">
        <CardButton onClick={() => void toggleTheme()}>
          <span>{messages.settings.darkMode}</span>
          <span
            className={`relative h-7 w-12 rounded-full ${theme === "dark" ? "bg-accent" : "bg-[var(--border)]"}`}
            aria-hidden
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${theme === "dark" ? "left-6" : "left-1"}`}
            />
          </span>
        </CardButton>
        <CardButton onClick={() => router.push("/zone")}>
          <span>{messages.world.precision}</span>
          <span>›</span>
        </CardButton>
        <CardButton onClick={() => setLangOpen((v) => !v)}>
          <span>{messages.settings.language}</span>
          <span>›</span>
        </CardButton>
        {langOpen ? (
          <div className="rounded-card bg-surface p-2 shadow-card">
            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left" onClick={() => void pickLocale("fr")}>
              {messages.common.french}
            </button>
            <button type="button" className="block w-full rounded-xl px-3 py-2 text-left" onClick={() => void pickLocale("en")}>
              {messages.common.english}
            </button>
          </div>
        ) : null}
        <CardButton onClick={() => setSecurityOpen((v) => !v)}>
          <span>{messages.settings.password}</span>
          <span>›</span>
        </CardButton>
        {securityOpen ? (
          <p className="rounded-card bg-surface p-4 text-sm text-muted shadow-card">{messages.settings.securityNote}</p>
        ) : null}
        <CardButton onClick={() => setPushOpen((v) => !v)}>
          <span>{messages.chat.pushTitle}</span>
          <span>›</span>
        </CardButton>
        {pushOpen ? (
          <div className="rounded-card bg-surface p-4 text-sm shadow-card">
            <p className="mb-3 text-muted">{messages.chat.pushHint}</p>
            {(["messages", "social", "events", "invitations", "mood"] as const).map((k) => (
              <label key={k} className="mb-2 flex items-center justify-between gap-3">
                <span>
                  {k === "messages"
                    ? messages.chat.pushMessages
                    : k === "social"
                      ? messages.chat.pushSocial
                      : k === "events"
                        ? messages.chat.pushEvents
                        : k === "invitations"
                          ? messages.chat.pushInvitations
                          : messages.chat.pushMood}
                </span>
                <input
                  type="checkbox"
                  checked={prefs[k]}
                  onChange={async (e) => {
                    const next = { ...prefs, [k]: e.target.checked };
                    setPrefs(next);
                    await api("/push/preferences", { method: "PATCH", body: JSON.stringify({ [k]: e.target.checked }) });
                  }}
                />
              </label>
            ))}
          </div>
        ) : null}
        <CardButton onClick={() => router.push("/terms")}>
          <span>{messages.settings.terms}</span>
          <span>›</span>
        </CardButton>
        <CardButton danger onClick={() => setConfirm(true)}>
          <span>{messages.settings.logout}</span>
        </CardButton>
      </div>
      {confirm ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6">
          <div className="w-full max-w-sm rounded-card bg-surface p-6">
            <p className="font-semibold">{messages.settings.logoutConfirm}</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="flex-1 rounded-pill bg-[var(--border)] py-3" onClick={() => setConfirm(false)}>
                {messages.common.cancel}
              </button>
              <button
                type="button"
                className="flex-1 rounded-pill bg-danger py-3 text-white"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
              >
                {messages.settings.logout}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
