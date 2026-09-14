"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import type { AdminSettings } from "@tiptop/domain";

export default function Page() {
  const [data, setData] = useState<AdminSettings | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<AdminSettings>("/admin/command-settings")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <AdminShell>
        <p className="text-sm text-muted">Chargement…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">Configuration (pas les données opérationnelles). Logo / couleurs : design system existant, pas de secrets ici.</p>
      <label className="mb-2 block text-sm">
        Nom
        <input value={data.appName} onChange={(e) => setData({ ...data, appName: e.target.value })} className="mt-1 w-full rounded-pill border border-[var(--border)] px-3 py-2" />
      </label>
      <label className="mb-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={data.maintenance} onChange={(e) => setData({ ...data, maintenance: e.target.checked })} />
        Maintenance
      </label>
      <label className="mb-2 block text-sm">
        Message maintenance
        <input value={data.maintenanceMessage} onChange={(e) => setData({ ...data, maintenanceMessage: e.target.value })} className="mt-1 w-full rounded-pill border border-[var(--border)] px-3 py-2" />
      </label>
      <label className="mb-2 block text-sm">
        Pays (CSV)
        <input value={data.countries.join(",")} onChange={(e) => setData({ ...data, countries: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className="mt-1 w-full rounded-pill border border-[var(--border)] px-3 py-2" />
      </label>
      <label className="mb-2 block text-sm">
        Devises (CSV)
        <input value={data.currencies.join(",")} onChange={(e) => setData({ ...data, currencies: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} className="mt-1 w-full rounded-pill border border-[var(--border)] px-3 py-2" />
      </label>
      <button
        type="button"
        className="rounded-pill bg-accent px-4 py-2 text-sm text-on-primary"
        onClick={() =>
          void api("/admin/command-settings", { method: "PATCH", body: JSON.stringify(data) })
            .then(() => setMsg("Enregistré"))
            .catch(() => setMsg("Permission settings.write requise"))
        }
      >
        Enregistrer
      </button>
      {msg ? <p className="mt-2 text-xs text-accent">{msg}</p> : null}
    </AdminShell>
  );
}
