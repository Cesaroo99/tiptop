"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { adminCopy } from "@/lib/admin-copy";

type Finance = {
  provider: string;
  stripe: { connected: boolean; reason: string };
  gmvXaf: number;
  refundedXaf: number;
  chargebacksXaf: number;
  stripeFeesXaf: number;
  pendingXaf: number;
  transferredXaf: number;
  availableXaf: number;
  heldXaf: number;
  payoutsXaf: number;
  commissionXaf: number;
  toOrganizersXaf: number;
  failedCount: number;
  platformFeePercent: number;
  payoutDelayDays: number;
  note: string;
};

export default function Page() {
  const [data, setData] = useState<Finance | null>(null);
  const [delay, setDelay] = useState("7");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<Finance>("/admin/finance")
      .then((d) => {
        setData(d);
        setDelay(String(d.payoutDelayDays));
      })
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <AdminShell>
        <p className="text-sm text-muted">Chargement…</p>
      </AdminShell>
    );
  }

  const rows: Array<[string, number | string]> = [
    ["GMV (mock)", data.gmvXaf],
    ["Commission TipTop", data.commissionXaf],
    ["Frais Stripe", data.stripeFeesXaf],
    ["Remboursements", data.refundedXaf],
    ["Chargebacks", data.chargebacksXaf],
    ["En attente", data.pendingXaf],
    ["Transférés", data.transferredXaf],
    ["Disponibles", data.availableXaf],
    ["Bloqués", data.heldXaf],
    ["Payouts", data.payoutsXaf],
    ["Dû organisateurs", data.toOrganizersXaf],
  ];

  return (
    <AdminShell>
      <p className="mb-3 rounded-card bg-amber-50 p-3 text-sm text-amber-950">{data.stripe.reason}</p>
      <p className="mb-3 text-xs text-muted">{data.note}</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-card bg-surface p-4 shadow-card">
            <p className="text-xl font-semibold text-accent">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm">Commission actuelle : {data.platformFeePercent}% — édition dans Ledger / paiements (ADMIN).</p>
      <label className="mt-3 block text-sm">
        Délai de versement (jours, config métier — aucun payout auto)
        <div className="mt-2 flex gap-2">
          <input value={delay} onChange={(e) => setDelay(e.target.value)} type="number" className="w-24 rounded-pill border border-[var(--border)] px-3 py-2 text-sm" />
          <button
            type="button"
            className="rounded-pill bg-accent px-3 py-2 text-sm text-on-primary"
            onClick={() =>
              void api("/admin/command-settings", {
                method: "PATCH",
                body: JSON.stringify({ payoutDelayDays: Number(delay) }),
              })
                .then(() => setMsg(adminCopy.save))
                .catch(() => setMsg("Permission refusée"))
            }
          >
            {adminCopy.save}
          </button>
        </div>
      </label>
      {msg ? <p className="mt-2 text-xs text-accent">{msg}</p> : null}
    </AdminShell>
  );
}
