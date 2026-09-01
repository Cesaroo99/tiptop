"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  body: string;
  hidden: boolean;
  createdAt: string;
  author: { username: string; firstName: string; lastName: string };
};

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    const data = await api<{ items: Row[] }>("/admin/posts");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function hide(id: string, next: boolean) {
    await api(`/admin/posts/${id}/hide`, { method: "POST", body: JSON.stringify({ hide: next }) });
    await load();
  }

  return (
    <AdminShell>
      {items.length === 0 ? <p className="text-sm text-muted">{messages.admin.empty}</p> : null}
      <div className="space-y-2">
        {items.map((p) => (
          <article key={p.id} className="rounded-card bg-surface p-4 shadow-card">
            <p className="text-sm">{p.body}</p>
            <p className="mt-1 text-xs text-muted">
              @{p.author.username}
              {p.hidden ? ` · ${messages.admin.hidden}` : ""}
            </p>
            <button
              type="button"
              className="mt-3 rounded-pill bg-[var(--border)] px-3 py-2 text-sm"
              onClick={() => void hide(p.id, !p.hidden)}
            >
              {p.hidden ? messages.admin.unhide : messages.admin.hide}
            </button>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
