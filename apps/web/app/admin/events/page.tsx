"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  title: string;
  city: string;
  startsAt: string;
  status: string;
  host: { username: string; firstName: string; lastName: string };
};

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);

  async function load() {
    const data = await api<{ items: Row[] }>("/admin/events");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  async function cancel(id: string) {
    await api(`/admin/events/${id}/cancel`, { method: "POST" });
    await load();
  }

  return (
    <AdminShell>
      {items.length === 0 ? <p className="text-sm text-muted">{messages.admin.empty}</p> : null}
      <div className="space-y-2">
        {items.map((e) => (
          <article key={e.id} className="rounded-card bg-surface p-4 shadow-card">
            <p className="font-semibold">{e.title}</p>
            <p className="text-xs text-muted">
              {e.city} · {e.status} · @{e.host.username}
            </p>
            {e.status !== "CANCELLED" ? (
              <button
                type="button"
                className="mt-3 rounded-pill bg-[var(--border)] px-3 py-2 text-sm"
                onClick={() => void cancel(e.id)}
              >
                {messages.admin.cancelEvent}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
