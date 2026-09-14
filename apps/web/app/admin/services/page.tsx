"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { StatusDot } from "@/components/admin/StatusDot";
import { api } from "@/lib/api";
import type { ServiceProbe } from "@tiptop/domain";

export default function Page() {
  const [items, setItems] = useState<ServiceProbe[]>([]);

  useEffect(() => {
    api<ServiceProbe[]>("/admin/services")
      .then(setItems)
      .catch(() => setItems([]));
  }, []);

  const groups = ["core", "firebase", "stripe", "maps", "ai", "analytics"] as const;

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">Chaque pastille repose sur un test ou une absence réelle dans la stack. Rien n’est inventé.</p>
      {groups.map((g) => (
        <section key={g} className="mb-4">
          <h2 className="mb-2 text-sm font-semibold uppercase">{g}</h2>
          {items
            .filter((s) => s.group === g)
            .map((s) => (
              <article key={s.id} className="mb-2 rounded-card bg-surface p-4 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{s.label}</p>
                  <StatusDot status={s.status} />
                </div>
                <p className="mt-1 text-xs text-muted">{s.message}</p>
                {s.masked ? <p className="mt-1 font-mono text-xs">{s.masked}</p> : null}
                {s.hint ? <p className="mt-1 text-xs text-muted">{s.hint}</p> : null}
              </article>
            ))}
        </section>
      ))}
    </AdminShell>
  );
}
