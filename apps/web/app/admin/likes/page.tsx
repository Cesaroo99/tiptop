"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Row = {
  user: { username: string; firstName: string; lastName: string };
  flags: string[];
  totalUnits: number;
  purchasedUnits: number;
  allocatedActive: number;
};

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);

  useEffect(() => {
    api<{ items: Row[] }>("/admin/likes/anomalies")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  function flagLabel(f: string) {
    if (f === "BURST") return messages.admin.anomalyBurst;
    if (f === "HIGH_BALANCE") return messages.admin.anomalyBalance;
    return messages.admin.anomalyUnused;
  }

  return (
    <AdminShell>
      {items.length === 0 ? <p className="text-sm text-muted">{messages.admin.noAnomalies}</p> : null}
      <div className="space-y-2">
        {items.map((a) => (
          <article key={a.user.username} className="rounded-card bg-surface p-4 shadow-card">
            <p className="font-semibold">
              {a.user.firstName} {a.user.lastName} @{a.user.username}
            </p>
            <p className="text-xs text-muted">
              {a.totalUnits} · {a.purchasedUnits} · {a.allocatedActive}
            </p>
            <p className="mt-2 text-sm text-accent">{a.flags.map(flagLabel).join(" · ")}</p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
