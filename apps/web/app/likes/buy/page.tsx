"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { PrimaryButton, ScreenHeader } from "@/components/ui";
import { api, ApiError, type LikePack } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <Suspense>
      <BuySheet />
    </Suspense>
  );
}

function BuySheet() {
  const { messages } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [packs, setPacks] = useState<LikePack[]>([]);
  const [packCode, setPackCode] = useState(params.get("pack") ?? "p5");
  const [provider, setProvider] = useState<"CARD" | "ORANGE_MONEY" | "MTN_MOMO">("CARD");
  const [fail, setFail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ items: LikePack[] }>("/likes/packs")
      .then((d) => {
        setPacks(d.items);
        if (!d.items.some((p) => p.code === packCode) && d.items[0]) {
          setPackCode(d.items[0].code);
        }
      })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = packs.find((p) => p.code === packCode) ?? packs[0];

  async function pay() {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ paymentStatus: string; purchase: { units: number } | null; credited: boolean }>(
        "/likes/purchase",
        {
          method: "POST",
          headers: { "Idempotency-Key": `likes_${selected.code}_${crypto.randomUUID()}` },
          body: JSON.stringify({ packCode: selected.code, provider, fail }),
        },
      );
      if (res.paymentStatus === "FAILED" || !res.credited) {
        setError(messages.wallet.paymentFailed);
        return;
      }
      router.replace(`/likes/success?units=${res.purchase?.units ?? selected.units}`);
    } catch (e) {
      setError(e instanceof ApiError ? messages.wallet.paymentFailed : messages.common.error);
    } finally {
      setLoading(false);
    }
  }

  const methods = [
    { id: "CARD" as const, label: messages.booking.card },
    { id: "ORANGE_MONEY" as const, label: messages.booking.orange },
    { id: "MTN_MOMO" as const, label: messages.booking.momo },
  ];

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.wallet.buyTitle} onBack={() => router.back()} />
      <p className="mb-4 text-sm text-muted">{messages.wallet.mockHint}</p>
      <div className="space-y-2">
        {packs.map((p) => (
          <button
            key={p.code}
            type="button"
            onClick={() => setPackCode(p.code)}
            className={`flex w-full items-center justify-between rounded-card p-4 text-left shadow-card ${
              packCode === p.code ? "bg-accent/10" : "bg-surface"
            }`}
          >
            <span className="font-semibold">{messages.wallet.packLabel.replace("{units}", String(p.units))}</span>
            <span className="text-sm text-muted">
              {messages.booking.amount.replace("{amount}", String(p.amountXaf))}
            </span>
          </button>
        ))}
      </div>
      {selected ? (
        <p className="mt-4 text-xl font-bold text-accent">
          {messages.booking.amount.replace("{amount}", String(selected.amountXaf))}
        </p>
      ) : null}
      <div className="mt-4 space-y-2">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setProvider(m.id)}
            className={`block w-full rounded-card p-3 text-left shadow-card ${
              provider === m.id ? "bg-accent/10" : "bg-surface"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} />
        {messages.booking.failDemo}
      </label>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-6">
        <PrimaryButton loading={loading} onClick={() => void pay()}>
          {messages.booking.pay}
        </PrimaryButton>
      </div>
    </main>
  );
}
