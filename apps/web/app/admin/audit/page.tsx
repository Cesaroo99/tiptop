"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Row = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor: { username: string; firstName: string };
  meta: unknown;
};

export default function Page() {
  const [items, setItems] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  async function load(query = q) {
    const data = await api<{ items: Row[] }>(`/admin/audit?q=${encodeURIComponent(query)}`);
    setItems(data.items);
  }

  useEffect(() => {
    void load("").catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">Journal append-only. Pas de bouton de suppression — les logs ne se retouchent pas depuis l’UI.</p>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 rounded-pill border border-[var(--border)] px-3 py-2 text-sm" placeholder="Action, username, id" />
        <button type="submit" className="rounded-pill bg-accent px-3 py-2 text-sm text-on-primary">
          OK
        </button>
      </form>
      {items.map((a) => (
        <article key={a.id} className="mb-2 rounded-card bg-surface p-3 shadow-card">
          <p className="text-sm font-semibold">
            @{a.actor.username} → {a.action}
          </p>
          <p className="text-xs text-muted">
            {a.createdAt.slice(0, 19)} · {a.entityType} {a.entityId}
          </p>
        </article>
      ))}
    </AdminShell>
  );
}
