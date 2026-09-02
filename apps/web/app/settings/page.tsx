"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CardButton, Modal, NavChevron, ScreenHeader } from "@/components/ui";
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

  const pushCategories = [
    ["messages", messages.chat.pushMessages],
    ["social", messages.chat.pushSocial],
    ["events", messages.chat.pushEvents],
    ["invitations", messages.chat.pushInvitations],
    ["mood", messages.chat.pushMood],
  ] as const;

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.settings.title} onBack={() => router.back()} />
      <p className="type-label mb-2 mt-2 px-1 text-subtle">{messages.settings.title}</p>
      <div className="space-y-2">
        <CardButton onClick={() => void toggleTheme()}>
          <span>{messages.settings.darkMode}</span>
          <ThemeSwitch on={theme === "dark"} />
        </CardButton>
        <CardButton onClick={() => router.push("/zone")}>
          <span>{messages.world.precision}</span>
          <NavChevron />
        </CardButton>
        <CardButton onClick={() => setLangOpen((v) => !v)}>
          <span>{messages.settings.language}</span>
          <NavChevron />
        </CardButton>
        {langOpen ? (
          <div className="space-y-1 rounded-card bg-surface p-2 shadow-card">
            <button
              type="button"
              className={`type-body-sm block w-full rounded-lg px-3 py-2.5 text-left transition ${locale === "fr" ? "bg-accent-soft text-accent" : "hover:bg-surface-sunken"}`}
              onClick={() => void pickLocale("fr")}
            >
              {messages.common.french}
            </button>
            <button
              type="button"
              className={`type-body-sm block w-full rounded-lg px-3 py-2.5 text-left transition ${locale === "en" ? "bg-accent-soft text-accent" : "hover:bg-surface-sunken"}`}
              onClick={() => void pickLocale("en")}
            >
              {messages.common.english}
            </button>
          </div>
        ) : null}

        <p className="type-label mb-1 mt-6 px-1 text-subtle">{messages.chat.pushTitle}</p>
        <CardButton onClick={() => setSecurityOpen((v) => !v)}>
          <span>{messages.settings.password}</span>
          <NavChevron />
        </CardButton>
        {securityOpen ? (
          <p className="type-body-sm rounded-card bg-surface p-4 text-muted shadow-xs">{messages.settings.securityNote}</p>
        ) : null}
        <CardButton onClick={() => setPushOpen((v) => !v)}>
          <span>{messages.chat.pushTitle}</span>
          <NavChevron />
        </CardButton>
        {pushOpen ? (
          <div className="space-y-1 rounded-card bg-surface p-4 shadow-xs">
            <p className="type-caption mb-3 text-muted">{messages.chat.pushHint}</p>
            {pushCategories.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between gap-3 py-2">
                <span className="type-body-sm text-ink">{label}</span>
                <Toggle
                  on={prefs[k]}
                  onChange={async (checked) => {
                    const next = { ...prefs, [k]: checked };
                    setPrefs(next);
                    await api("/push/preferences", { method: "PATCH", body: JSON.stringify({ [k]: checked }) });
                  }}
                />
              </label>
            ))}
          </div>
        ) : null}

        <p className="type-label mb-1 mt-6 px-1 text-subtle">{messages.brand.name}</p>
        <CardButton onClick={() => router.push("/terms")}>
          <span>{messages.settings.terms}</span>
          <NavChevron />
        </CardButton>
        <CardButton danger onClick={() => setConfirm(true)}>
          <span>{messages.settings.logout}</span>
        </CardButton>
      </div>
      <Modal
        open={confirm}
        title={messages.settings.logoutConfirm}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          await logout();
          router.replace("/login");
        }}
        confirmLabel={messages.settings.logout}
        danger
      >
        {""}
      </Modal>
    </main>
  );
}

function ThemeSwitch({ on }: { on: boolean }) {
  return (
    <span className={`relative h-7 w-12 rounded-full transition ${on ? "bg-accent" : "bg-border"}`} aria-hidden>
      <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-xs transition ${on ? "left-6" : "left-1"}`} />
    </span>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`tap-scale relative h-6 w-10 rounded-full transition ${on ? "bg-accent" : "bg-border"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition ${on ? "left-[18px]" : "left-0.5"}`} />
    </button>
  );
}
