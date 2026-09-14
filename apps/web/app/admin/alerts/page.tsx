"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Overview = { alerts: Array<{ id: string; level: string; title: string; body: string; href?: string }> };

export default function Page() {
  const [alerts, setAlerts] = useState<Overview["alerts"]>([]);

  useEffect(() => {
    api<Overview>("/admin/command")
      .then((d) => setAlerts(d.alerts))
      .catch(() => setAlerts([]));
  }, []);

  return (
    <AdminShell>
      {alerts.map((a) => (
        <Link key={a.id} href={a.href ?? "/admin/services"} className="mb-2 block rounded-card bg-surface p-4 shadow-card">
          <p className="font-semibold">
            {a.level} · {a.title}
          </p>
          <p className="text-xs text-muted">{a.body}</p>
        </Link>
      ))}
    </AdminShell>
  );
}
