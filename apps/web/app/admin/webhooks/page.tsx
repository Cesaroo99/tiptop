"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Payload = {
  endpoints: Array<{ id: string; path: string; configured: boolean; provider: string; message?: string }>;
  items: Array<{ id: string; provider: string; type: string; status: string; attempts: number; createdAt: string; lastError: string | null }>;
};

export default function Page() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    api<Payload>("/admin/webhooks")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <AdminShell>
      {data?.endpoints.map((e) => (
        <article key={e.id} className="mb-2 rounded-card bg-surface p-4 shadow-card">
          <p className="font-semibold">
            {e.provider} · {e.path}
          </p>
          <p className="text-xs text-muted">
            {e.configured ? "Secret posé" : "Non configuré"} {e.message ?? ""}
          </p>
        </article>
      ))}
      <h2 className="mb-2 mt-4 text-sm font-semibold">Reçus (idempotents)</h2>
      {data?.items.map((w) => (
        <p key={w.id} className="text-xs text-muted">
          {w.createdAt.slice(0, 19)} · {w.provider} · {w.type} · {w.status} · tentatives {w.attempts} {w.lastError ?? ""}
        </p>
      ))}
    </AdminShell>
  );
}
