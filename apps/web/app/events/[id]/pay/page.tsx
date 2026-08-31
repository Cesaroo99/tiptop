"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PrimaryButton } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <Suspense>
        <PaySheet />
      </Suspense>
    </AppShell>
  );
}

function PaySheet() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const reservationId = params.get("reservationId") ?? "";
  const { messages } = useI18n();
  const router = useRouter();
  const [provider, setProvider] = useState<"CARD" | "ORANGE_MONEY" | "MTN_MOMO">("CARD");
  const [fail, setFail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<number | null>(null);

  useEffect(() => {
    api<{ items: Array<{ id: string; amountXaf: number }> }>("/reservations")
      .then((d) => {
        const row = d.items.find((r) => r.id === reservationId);
        if (row) setAmount(row.amountXaf);
      })
      .catch(() => undefined);
  }, [reservationId]);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ needsPayment: boolean; tickets: Array<{ id: string }>; paymentStatus?: string }>(
        "/payments",
        {
          method: "POST",
          headers: { "Idempotency-Key": `ui_${reservationId}_${provider}_${crypto.randomUUID()}` },
          body: JSON.stringify({ reservationId, provider, fail }),
        },
      );
      if (res.paymentStatus === "FAILED" || res.needsPayment) {
        setError(messages.booking.payFail);
        return;
      }
      const ticketId = res.tickets[0]?.id;
      router.replace(`/pay/success?ticketId=${ticketId ?? ""}&eventId=${id}`);
    } catch (e) {
      setError(e instanceof ApiError ? messages.booking.payFail : messages.common.error);
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
    <div className="px-4 py-6">
      <h1 className="text-lg font-semibold">{messages.booking.pay}</h1>
      <p className="mt-1 text-sm text-muted">{messages.booking.mockHint}</p>
      {amount != null ? (
        <p className="mt-3 text-xl font-bold text-accent">{messages.booking.amount.replace("{amount}", String(amount))}</p>
      ) : null}
      <div className="mt-4 space-y-2">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setProvider(m.id)}
            className={`block w-full rounded-card p-4 text-left shadow-card ${provider === m.id ? "bg-accent/10" : "bg-surface"}`}
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
        <PrimaryButton loading={loading} disabled={!reservationId} onClick={() => void pay()}>
          {messages.booking.pay}
        </PrimaryButton>
      </div>
    </div>
  );
}
