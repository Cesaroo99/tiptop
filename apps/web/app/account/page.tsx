"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PresencePicker } from "@/components/PresencePicker";
import { PrimaryButton, ScreenHeader, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { presenceFromDeclared } from "@tiptop/domain";

export default function AccountPage() {
  const { messages } = useI18n();
  const { user, refresh } = useSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [profession, setProfession] = useState(user?.profession ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  if (!user) return null;

  async function setMyPresence(availability: "AVAILABLE" | "BUSY" | "HIDDEN") {
    setStatusBusy(true);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ availability, ttlHours: 4 }),
      });
      await refresh();
    } finally {
      setStatusBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName, profession, username }),
      });
      await refresh();
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.account.title} onBack={() => router.back()} />
      <form onSubmit={save} className="mt-4 space-y-4 rounded-card bg-surface p-5 shadow-card">
        <div className="mx-auto h-28 w-28 rounded-full bg-accent/20" />
        <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={messages.account.firstName} />
        <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={messages.account.lastName} />
        <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder={messages.account.username} />
        <TextInput value={profession} onChange={(e) => setProfession(e.target.value)} placeholder={messages.account.profession} />
        <TextInput value={user.phoneE164} disabled />
        <div className="space-y-2 text-center">
          <p className="type-caption font-semibold text-muted">{messages.account.status}</p>
          <PresencePicker
            value={presenceFromDeclared(user.availability)}
            busy={statusBusy}
            onChange={(k) => void setMyPresence(k)}
          />
          <p className="type-caption leading-5 text-muted">{messages.account.statusHint}</p>
        </div>
        {saved ? <p className="text-sm text-success">{messages.account.saved}</p> : null}
        <PrimaryButton type="submit" loading={loading}>
          {messages.account.save}
        </PrimaryButton>
      </form>
    </main>
  );
}
