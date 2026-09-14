"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Row = {
  id: string;
  kind: string;
  reason: string;
  body: string;
  createdAt: string;
  priority: string;
  privateMessageHidden?: boolean;
  reporter: { username: string };
  targetUser: { username: string } | null;
  post: { body: string } | null;
  event: { title: string } | null;
  mood: { body: string } | null;
};

export default function Page() {
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    const data = await api<{ items: Row[] }>("/admin/moderation");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function review(id: string, status: "DISMISSED" | "ACTIONED") {
    await api(`/admin/reports/${id}/review`, { method: "POST", body: JSON.stringify({ status }) });
    await load();
  }

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">File humaine. L’IA peut prioriser plus tard — les actions critiques restent staff.</p>
      {items.map((r) => (
        <article key={r.id} className="mb-2 rounded-card bg-surface p-4 shadow-card">
          <p className="font-semibold">
            {r.priority} · {r.kind} · {r.reason}
          </p>
          <p className="text-xs text-muted">
            par @{r.reporter.username} · {r.createdAt.slice(0, 16)}
          </p>
          <p className="mt-2 text-sm">
            {r.privateMessageHidden
              ? "Contenu de message privé non exposé."
              : r.post?.body || r.mood?.body || r.event?.title || r.body || r.targetUser?.username}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <button type="button" className="rounded-pill bg-[var(--border)] px-3 py-2" onClick={() => void review(r.id, "DISMISSED")}>
              Approve / classer
            </button>
            <button type="button" className="rounded-pill bg-danger px-3 py-2 text-on-primary" onClick={() => void review(r.id, "ACTIONED")}>
              Remove
            </button>
          </div>
        </article>
      ))}
    </AdminShell>
  );
}
