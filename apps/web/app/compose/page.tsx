"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PrimaryButton, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function ComposePage() {
  return (
    <AppShell>
      <Composer />
    </AppShell>
  );
}

function Composer() {
  const { messages } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [withLoc, setWithLoc] = useState(true);
  const [city, setCity] = useState(user?.city ?? "Yaoundé");
  const [zone, setZone] = useState(user?.zone ?? "Carrefour Damas");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setLoading(true);
    setError(null);
    try {
      await api("/posts", {
        method: "POST",
        body: JSON.stringify({
          body,
          city: withLoc ? city : undefined,
          zone: withLoc ? zone : undefined,
          imageUrl: imageUrl || undefined,
        }),
      });
      router.replace("/");
    } catch {
      setError(messages.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="text-xl text-muted" aria-label={messages.common.close}>
          ×
        </button>
        <p className="font-semibold">{messages.social.publication}</p>
        <button
          type="button"
          disabled={loading || !body.trim()}
          onClick={() => void publish()}
          className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {messages.social.publish}
        </button>
      </div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={messages.social.saySomething}
        className="min-h-40 w-full rounded-2xl border border-[var(--border)] bg-surface p-4 text-ink"
      />
      {withLoc ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" />
          <TextInput value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone" />
        </div>
      ) : null}
      <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-3">
        <button type="button" className="flex w-full items-center gap-2 py-2 text-left text-ink" onClick={() => setImageUrl((v) => (v ? "" : "/seed/black-white.svg"))}>
          <span>📷</span> {messages.social.addImage}
          <span className="ml-auto text-xs text-muted">{imageUrl ? "✓" : messages.social.noImageHint}</span>
        </button>
        <button type="button" className="flex w-full items-center gap-2 py-2 text-left text-ink" onClick={() => setWithLoc((v) => !v)}>
          <span>📍</span> {messages.social.addLocation}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-6 md:hidden">
        <PrimaryButton disabled={!body.trim()} loading={loading} onClick={() => void publish()}>
          {messages.social.publish}
        </PrimaryButton>
      </div>
    </div>
  );
}
