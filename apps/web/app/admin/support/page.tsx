"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Lookup = {
  user: { id: string; username: string; firstName: string; lastName: string; status: string; role: string; phoneMasked: string } | null;
  timeline: Array<{ at: string; kind: string; label: string; payment?: string | null }>;
};

function SupportInner() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [q, setQ] = useState(initial);
  const [data, setData] = useState<Lookup | null>(null);

  async function load(query = q) {
    setData(await api<Lookup>(`/admin/support?q=${encodeURIComponent(query)}`));
  }

  useEffect(() => {
    if (initial) void load(initial).catch(() => setData(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <AdminShell>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} className="flex-1 rounded-pill border border-[var(--border)] px-3 py-2 text-sm" placeholder="Cesar, username, téléphone, id" />
        <button type="submit" className="rounded-pill bg-accent px-3 py-2 text-sm text-on-primary">
          Dossier
        </button>
      </form>
      {data?.user ? (
        <>
          <p className="font-semibold">
            {data.user.firstName} {data.user.lastName} @{data.user.username}
          </p>
          <p className="mb-3 text-xs text-muted">
            {data.user.status} · {data.user.role} · {data.user.phoneMasked}
          </p>
          <ol className="space-y-2">
            {data.timeline.map((t, i) => (
              <li key={`${t.at}-${i}`} className="rounded-card bg-surface p-3 text-sm shadow-card">
                <p className="text-xs text-muted">{t.at.slice(0, 19)} · {t.kind}</p>
                <p>
                  {t.label}
                  {t.payment ? ` · paiement ${t.payment}` : ""}
                </p>
              </li>
            ))}
          </ol>
        </>
      ) : (
        <p className="text-sm text-muted">Cherche un compte pour voir auth → résa → paiement → billet → notif.</p>
      )}
    </AdminShell>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4 text-sm">Chargement…</p>}>
      <SupportInner />
    </Suspense>
  );
}
