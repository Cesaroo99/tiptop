"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PrimaryButton, ScreenHeader, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function OnboardingPage() {
  const { messages } = useI18n();
  const { user, refresh } = useSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profession, setProfession] = useState(user?.profession || "");
  const [city, setCity] = useState(user?.city || "Yaoundé");
  const [zone, setZone] = useState(user?.zone || "Carrefour Damas");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName, profession, city, zone }),
      });
      await refresh();
      router.replace("/");
    } catch {
      setError(messages.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <ScreenHeader title={messages.onboarding.title} />
      <p className="px-2 text-sm text-muted">{messages.onboarding.subtitle}</p>
      <form onSubmit={save} className="mt-6 space-y-4 px-2">
        <TextInput placeholder={messages.account.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <TextInput placeholder={messages.account.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <TextInput placeholder={messages.account.profession} value={profession} onChange={(e) => setProfession(e.target.value)} />
        <TextInput placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
        <TextInput placeholder="Zone" value={zone} onChange={(e) => setZone(e.target.value)} />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <PrimaryButton type="submit" loading={loading}>
          {messages.onboarding.continue}
        </PrimaryButton>
      </form>
    </main>
  );
}
