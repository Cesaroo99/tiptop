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

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  async function load() {
    const data = await api<{ items: Row[] }>("/admin/payments");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function refund(id: string, fullAmount: number) {
    const raw = amounts[id];
    const amountXaf = raw ? Number(raw) : fullAmount;
    await api(`/admin/payments/${id}/refund`, { method: "POST", body: JSON.stringify({ amountXaf }) });
    await load();
  }

  return (
    <AdminShell>
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
