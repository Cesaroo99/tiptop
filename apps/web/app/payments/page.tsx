"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, PrimaryButton, ScreenHeader, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Method = { id: string; provider: string; label: string };

export default function Page() {
  const { messages } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<Method[] | null>(null);
  const [provider, setProvider] = useState<"CARD" | "ORANGE_MONEY" | "MTN_MOMO">("CARD");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    const data = await api<{ items: Method[] }>("/payments/methods");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function add() {
    setLoading(true);
    try {
      await api("/payments/methods", {
        method: "POST",
        body: JSON.stringify({ provider, label: label.trim() || provider }),
      });
      setLabel("");
      await load();
    } finally {
      setLoading(false);
    }
  }

  const names: Record<string, string> = {
    CARD: messages.booking.card,
    ORANGE_MONEY: messages.booking.orange,
    MTN_MOMO: messages.booking.momo,
  };

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.booking.methodsTitle} onBack={() => router.back()} />
      <p className="mb-4 text-sm text-muted">{messages.booking.mockHint}</p>
      {items && items.length === 0 ? <EmptyState title={messages.booking.methodsTitle} body={messages.booking.methodsEmpty} /> : null}
      <div className="space-y-2">
        {items?.map((m) => (
          <article key={m.id} className="rounded-card bg-surface p-4 shadow-card">
            <p className="font-semibold">{m.label}</p>
            <p className="text-xs text-muted">{names[m.provider] ?? m.provider}</p>
          </article>
        ))}
      </div>
      <div className="mt-6 space-y-3">
        <p className="text-sm font-semibold">{messages.booking.addMethod}</p>
        {(["CARD", "ORANGE_MONEY", "MTN_MOMO"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setProvider(p)}
            className={`block w-full rounded-card p-3 text-left shadow-card ${provider === p ? "bg-accent/10" : "bg-surface"}`}
          >
            {names[p]}
          </button>
        ))}
        <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder={messages.booking.labelHint} />
        <PrimaryButton loading={loading} onClick={() => void add()}>
          {messages.booking.addMethod}
        </PrimaryButton>
      </div>
    </main>
  );
}
