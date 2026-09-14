"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Detail = {
  id: string;
  title: string;
  description: string;
  city: string;
  zone: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  startsAt: string;
  status: string;
  featured: boolean;
  suspendedAt: string | null;
  priceXaf: number;
  capacity: number | null;
  sold: number;
  remaining: number | null;
  revenueXaf: number;
  previewPath: string;
  host: { username: string; firstName: string; lastName: string; salesBlocked: boolean };
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const [data, setData] = useState<Detail | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setData(await api<Detail>(`/admin/catalog/events/${id}`));
    } catch {
      setErr(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function act(action: string) {
    setErr("");
    try {
      await api(`/admin/catalog/events/${id}`, { method: "POST", body: JSON.stringify({ action }) });
      await load();
    } catch {
      setErr(messages.admin.forbidden);
    }
  }

  if (!data) {
    return (
      <AdminShell>
        <p className="text-sm text-muted">{err || messages.common.loading}</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {err ? <p className="mb-2 text-sm text-red-600">{err}</p> : null}
      <article className="rounded-card bg-surface p-4 shadow-card">
        <h1 className="text-lg font-semibold">{data.title}</h1>
        <p className="mt-2 text-sm">{data.description}</p>
        <p className="mt-2 text-xs text-muted">
          {data.city} {data.zone} · {data.address} · {data.startsAt} · {data.status}
        </p>
        <p className="text-xs text-muted">
          @{data.host.username} · {data.priceXaf} · {data.sold} vendus · reste {data.remaining ?? "∞"} · CA {data.revenueXaf}
        </p>
        {data.latitude != null ? (
          <p className="text-xs text-muted">
            {data.latitude.toFixed(4)}, {data.longitude?.toFixed(4)}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <button type="button" className="rounded-pill bg-[var(--border)] px-3 py-2" onClick={() => void act("approve")}>
            Approuver
          </button>
          <button type="button" className="rounded-pill bg-[var(--border)] px-3 py-2" onClick={() => void act("refuse")}>
            Refuser
          </button>
          <button type="button" className="rounded-pill bg-[var(--border)] px-3 py-2" onClick={() => void act("suspend")}>
            Suspendre
          </button>
          <button type="button" className="rounded-pill bg-[var(--border)] px-3 py-2" onClick={() => void act("restore")}>
            Restaurer
          </button>
          <button type="button" className="rounded-pill bg-[var(--border)] px-3 py-2" onClick={() => void act(data.featured ? "unfeature" : "feature")}>
            {data.featured ? "Retirer à la une" : "Mettre en avant"}
          </button>
          <button type="button" className="rounded-pill bg-danger px-3 py-2 text-on-primary" onClick={() => void act("cancel")}>
            Annuler
          </button>
          <button
            type="button"
            className="rounded-pill bg-accent px-3 py-2 text-on-primary"
            onClick={() => void api(`/admin/catalog/events/${id}/refund-all`, { method: "POST" }).then(() => load())}
          >
            Rembourser les billets
          </button>
        </div>
        <Link href={data.previewPath} className="mt-4 inline-block text-sm text-accent">
          Event Preview (vue app)
        </Link>
      </article>
    </AdminShell>
  );
}
