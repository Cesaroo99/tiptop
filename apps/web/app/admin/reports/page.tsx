"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  kind: string;
  reason: string;
  body: string;
  status: string;
  createdAt: string;
  reporter: { username: string; firstName: string; lastName: string };
  targetUser: { username: string } | null;
  post: { body: string } | null;
  event: { title: string } | null;
};

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    const data = await api<{ items: Row[] }>("/admin/reports");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function review(id: string, status: "DISMISSED" | "ACTIONED") {
    await api(`/admin/reports/${id}/review`, { method: "POST", body: JSON.stringify({ status }) });
    await load();
  }

  function statusLabel(s: string) {
    if (s === "DISMISSED") return messages.admin.dismiss;
    if (s === "ACTIONED") return messages.admin.actioned;
    return messages.admin.open;
  }

  return (
    <AdminShell>
      {items.length === 0 ? <p className="text-sm text-muted">{messages.admin.empty}</p> : null}
      <div className="space-y-2">
        {items.map((r) => (
          <article key={r.id} className="rounded-card bg-surface p-4 shadow-card">
            <p className="font-semibold">
              {r.kind} · {r.reason} · {statusLabel(r.status)}
            </p>
            <p className="text-sm text-muted">{r.body || r.post?.body || r.event?.title || ""}</p>
            <p className="text-xs text-muted">@{r.reporter.username}</p>
            {r.status === "OPEN" ? (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="rounded-pill bg-[var(--border)] px-3 py-2 text-sm"
                  onClick={() => void review(r.id, "DISMISSED")}
                >
                  {messages.admin.dismiss}
                </button>
                <button
                  type="button"
                  className="rounded-pill bg-accent px-3 py-2 text-sm text-white"
                  onClick={() => void review(r.id, "ACTIONED")}
                >
                  {messages.admin.actioned}
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
