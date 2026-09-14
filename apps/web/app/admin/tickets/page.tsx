"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  status: string;
  amountXaf: number;
  paymentStatus: string;
  provider: string | null;
  holder: { username: string };
  booker: { username: string };
  event: { title: string };
  reservationId: string;
};

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  async function load() {
    const data = await api<{ items: Row[] }>(`/admin/tickets?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`);
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <AdminShell>
      <form
        className="mb-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 rounded-pill border border-[var(--border)] px-3 py-2 text-sm" placeholder="User, event, ticket, résa" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-pill border border-[var(--border)] px-3 py-2 text-sm">
          <option value="">Tous</option>
          {["CONFIRMED", "AWAITING_PAYMENT", "CONSUMED", "CANCELLED", "REFUNDED", "EXPIRED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button type="submit" className="rounded-pill bg-accent px-3 py-2 text-sm text-on-primary">
          OK
        </button>
      </form>
      {items.length === 0 ? <p className="text-sm text-muted">{messages.admin.empty}</p> : null}
      {items.map((t) => (
        <article key={t.id} className="mb-2 rounded-card bg-surface p-4 shadow-card">
          <p className="font-semibold">{t.event.title}</p>
          <p className="text-xs text-muted">
            {t.id} · {t.status} · payeur @{t.booker.username} · titulaire @{t.holder.username} · {t.amountXaf} · paiement{" "}
            {t.paymentStatus} {t.provider ?? ""}
          </p>
        </article>
      ))}
    </AdminShell>
  );
}
