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
  provider: string;
  createdAt: string;
  user: { username: string; firstName: string; lastName: string };
  packCode: string | null;
};

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    const data = await api<{ items: Row[] }>("/admin/payments");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function refund(id: string) {
    await api(`/admin/payments/${id}/refund`, { method: "POST" });
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
              {p.status === "REFUNDED" ? messages.admin.refunded : p.status} · @{p.user.username}
              {p.packCode ? ` · ${p.packCode}` : ""}
            </p>
            {p.status === "SUCCEEDED" ? (
              <button
                type="button"
                className="mt-3 rounded-pill bg-[var(--border)] px-3 py-2 text-sm"
                onClick={() => void refund(p.id)}
              >
                {messages.admin.refund}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
