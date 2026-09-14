"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  organizerStatus: string;
  salesBlocked: boolean;
  _count: { hostedEvents: number };
  salesXaf: number;
  refundedXaf: number;
  trustScore: number;
};

export default function Page() {
  const { messages } = useI18n();
  const [items, setItems] = useState<Row[]>([]);

  useEffect(() => {
    api<{ items: Row[] }>("/admin/organizers")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <AdminShell>
      {items.length === 0 ? <p className="text-sm text-muted">{messages.admin.empty}</p> : null}
      <div className="space-y-2">
        {items.map((o) => (
          <article key={o.id} className="rounded-card bg-surface p-4 shadow-card">
            <Link href={`/admin/users/${o.id}`} className="font-semibold">
              {o.firstName} {o.lastName} @{o.username}
            </Link>
            <p className="text-xs text-muted">
              {o.organizerStatus} · confiance {o.trustScore} · {o._count.hostedEvents} sorties · ventes {o.salesXaf} ·
              remb. {o.refundedXaf}
              {o.salesBlocked ? " · ventes bloquées" : ""}
            </p>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
