"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  kind: string;
  status: string;
  amountXaf: number;
  refundedAmountXaf?: number | null;
  provider: string;
  createdAt: string;
  user: { username: string; firstName: string; lastName: string };
  packCode: string | null;
};

type Monetization = {
  platformFeePercent: number;
  defaultPlatformFeePercent: number;
  ticketPaymentsEnabled: boolean;
};

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [fee, setFee] = useState("0");
  const [saved, setSaved] = useState("");
  const [feeError, setFeeError] = useState("");

  async function load() {
    const [data, settings] = await Promise.all([
      api<{ items: Row[] }>("/admin/payments"),
      api<Monetization>("/admin/settings"),
    ]);
    setItems(data.items);
    setFee(String(settings.platformFeePercent));
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function saveFee() {
    setSaved("");
    setFeeError("");
    const n = Number(fee);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      setFeeError(messages.admin.platformFeeInvalid);
      return;
    }
    try {
      const next = await api<Monetization>("/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ platformFeePercent: n }),
      });
      setFee(String(next.platformFeePercent));
      setSaved(messages.admin.platformFeeSaved);
    } catch {
      setFeeError(messages.admin.platformFeeInvalid);
    }
  }

  async function refund(id: string, fullAmount: number) {
    const raw = amounts[id];
    const amountXaf = raw ? Number(raw) : fullAmount;
    await api(`/admin/payments/${id}/refund`, { method: "POST", body: JSON.stringify({ amountXaf }) });
    await load();
  }

  return (
    <AdminShell>
      <section className="mb-6 rounded-card bg-surface p-4 shadow-card">
        <h2 className="text-sm font-semibold">{messages.admin.monetization}</h2>
        <p className="mt-1 text-xs text-muted">{messages.admin.platformFeeHint}</p>
        <p className="mt-2 text-xs text-muted">{messages.admin.ticketVsFee}</p>
        <label className="mt-4 block text-sm">
          {messages.admin.platformFee}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-28 rounded-pill border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
            <span className="text-sm text-muted">%</span>
            <button type="button" className="rounded-pill bg-accent px-3 py-2 text-sm text-white" onClick={() => void saveFee()}>
              {messages.admin.saveFee}
            </button>
          </div>
        </label>
        {saved ? <p className="mt-2 text-xs text-accent">{saved}</p> : null}
        {feeError ? <p className="mt-2 text-xs text-red-600">{feeError}</p> : null}
      </section>
      <p className="mb-4 text-sm text-muted">{messages.admin.mockRefundHint}</p>
      {items.length === 0 ? <p className="text-sm text-muted">{messages.admin.empty}</p> : null}
      <div className="space-y-2">
        {items.map((p) => (
          <article key={p.id} className="rounded-card bg-surface p-4 shadow-card">
            <p className="font-semibold">
              {messages.booking.amount.replace("{amount}", String(p.amountXaf))} · {p.kind}
            </p>
            <p className="text-xs text-muted">
              {p.status === "REFUNDED"
                ? messages.admin.refunded
                : p.status === "PARTIALLY_REFUNDED"
                  ? `${messages.admin.refundedPartial} (${p.refundedAmountXaf ?? 0}/${p.amountXaf})`
                  : p.status}
              {" · "}@{p.user.username}
              {p.packCode ? ` · ${p.packCode}` : ""}
            </p>
            {p.status === "SUCCEEDED" ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={p.amountXaf}
                  placeholder={String(p.amountXaf)}
                  value={amounts[p.id] ?? ""}
                  onChange={(e) => setAmounts((cur) => ({ ...cur, [p.id]: e.target.value }))}
                  className="w-28 rounded-pill border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  className="rounded-pill bg-[var(--border)] px-3 py-2 text-sm"
                  onClick={() => void refund(p.id, p.amountXaf)}
                >
                  {messages.admin.refund}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
