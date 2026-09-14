"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { adminCopy } from "@/lib/admin-copy";

type Row = {
  id: string;
  status: string;
  amountXaf: number;
  refundedAmountXaf: number | null;
  user: { username: string };
  eventTitle: string | null;
  eventStatus: string | null;
  refundable: boolean;
};

export default function Page() {
  const [items, setItems] = useState<Row[]>([]);
  const [rules, setRules] = useState({ autoRefundOnCancel: true, allowPartial: true });
  const [msg, setMsg] = useState("");

  async function load() {
    const [center, r] = await Promise.all([
      api<{ items: Row[] }>("/admin/refunds"),
      api<typeof rules>("/admin/refund-rules"),
    ]);
    setItems(center.items);
    setRules(r);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">{adminCopy.mockLedger}. Idempotent : un paiement SUCCEEDED une seule fois.</p>
      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={rules.autoRefundOnCancel}
          onChange={(e) => {
            const next = { ...rules, autoRefundOnCancel: e.target.checked };
            setRules(next);
            void api("/admin/refund-rules", { method: "PATCH", body: JSON.stringify(next) })
              .then(() => setMsg("Règle enregistrée"))
              .catch(() => setMsg("Permission finance.settings requise"));
          }}
        />
        Remboursement automatique si sortie annulée (règle + bouton bulk)
      </label>
      {msg ? <p className="mb-2 text-xs text-accent">{msg}</p> : null}
      {items.map((p) => (
        <article key={p.id} className="mb-2 rounded-card bg-surface p-4 shadow-card">
          <p className="font-semibold">
            {p.amountXaf} · {p.status} · @{p.user.username}
          </p>
          <p className="text-xs text-muted">
            {p.eventTitle} · {p.eventStatus} · remboursé {p.refundedAmountXaf ?? 0}
          </p>
          {p.refundable ? (
            <button
              type="button"
              className="mt-2 rounded-pill bg-[var(--border)] px-3 py-2 text-sm"
              onClick={() =>
                void api(`/admin/payments/${p.id}/refund`, { method: "POST", body: JSON.stringify({ amountXaf: p.amountXaf }) }).then(() => load())
              }
            >
              Rembourser (mock Stripe = ledger)
            </button>
          ) : null}
        </article>
      ))}
    </AdminShell>
  );
}
