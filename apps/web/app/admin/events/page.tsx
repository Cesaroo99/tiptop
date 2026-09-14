"use client";

import Link from "next/link";
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
  featured: boolean;
  suspended: boolean;
  priceXaf: number;
  tickets: number;
  reports: number;
  host: { username: string; firstName: string; lastName: string };
};

const FILTERS = [
  { id: "", label: "Tous" },
  { id: "upcoming", label: "À venir" },
  { id: "ended", label: "Terminés" },
  { id: "draft", label: "Brouillons" },
  { id: "cancelled", label: "Annulés" },
  { id: "reported", label: "Signalés" },
  { id: "suspended", label: "Suspendus" },
];

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);
  const [status, setStatus] = useState("");
  const [paid, setPaid] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (paid) params.set("paid", paid);
    if (q) params.set("q", q);
    const data = await api<{ items: Row[] }>(`/admin/catalog/events?${params.toString()}`);
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, paid]);

  return (
    <AdminShell>
      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatus(f.id)}
            className={`rounded-pill px-3 py-1 text-xs ${status === f.id ? "bg-accent text-on-primary" : "bg-surface shadow-card"}`}
          >
            {f.label}
          </button>
        ))}
        <button type="button" onClick={() => setPaid(paid === "paid" ? "" : "paid")} className="rounded-pill bg-surface px-3 py-1 text-xs shadow-card">
          Payants
        </button>
        <button type="button" onClick={() => setPaid(paid === "free" ? "" : "free")} className="rounded-pill bg-surface px-3 py-1 text-xs shadow-card">
          Gratuits
        </button>
      </div>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 rounded-pill border border-[var(--border)] px-3 py-2 text-sm" placeholder="Titre ou id" />
        <button type="submit" className="rounded-pill bg-accent px-3 py-2 text-sm text-on-primary">
          OK
        </button>
      </form>
      {items.length === 0 ? <p className="text-sm text-muted">{messages.admin.empty}</p> : null}
      <div className="space-y-2">
        {items.map((e) => (
          <article key={e.id} className="rounded-card bg-surface p-4 shadow-card">
            <Link href={`/admin/events/${e.id}`} className="font-semibold">
              {e.title}
            </Link>
            <p className="text-xs text-muted">
              {e.city} · {e.status}
              {e.suspended ? " · suspendu" : ""}
              {e.featured ? " · mis en avant" : ""} · {e.priceXaf} · {e.tickets} billets · @{e.host.username}
            </p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
