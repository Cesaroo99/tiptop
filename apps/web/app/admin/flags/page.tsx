"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { FEATURE_FLAG_KEYS, type FeatureFlagKey, type FeatureFlagRule } from "@tiptop/domain";

export default function Page() {
  const [flags, setFlags] = useState<Record<FeatureFlagKey, FeatureFlagRule> | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<Record<FeatureFlagKey, FeatureFlagRule>>("/admin/feature-flags")
      .then(setFlags)
      .catch(() => setFlags(null));
  }, []);

  if (!flags) {
    return (
      <AdminShell>
        <p className="text-sm text-muted">Chargement…</p>
      </AdminShell>
    );
  }

  function save(next: Record<FeatureFlagKey, FeatureFlagRule>) {
    setFlags(next);
    void api("/admin/feature-flags", { method: "PATCH", body: JSON.stringify({ flags: next }) })
      .then(() => setMsg("Flags enregistrés — pas de redéploiement."))
      .catch(() => setMsg("Permission flags.write requise (TECH / SUPER ADMIN)"));
  }

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">Activation globale. Pourcentage = bucket utilisateur. Pays = ISO.</p>
      {FEATURE_FLAG_KEYS.map((key) => {
        const rule = flags[key];
        return (
          <article key={key} className="mb-2 rounded-card bg-surface p-4 shadow-card">
            <label className="flex items-center justify-between text-sm font-semibold">
              {key}
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={(e) => save({ ...flags, [key]: { ...rule, enabled: e.target.checked } })}
              />
            </label>
            <label className="mt-2 block text-xs text-muted">
              % utilisateurs
              <input
                type="number"
                min={0}
                max={100}
                value={rule.percent}
                onChange={(e) => save({ ...flags, [key]: { ...rule, percent: Number(e.target.value) } })}
                className="ml-2 w-20 rounded-pill border border-[var(--border)] px-2 py-1"
              />
            </label>
          </article>
        );
      })}
      {msg ? <p className="text-xs text-accent">{msg}</p> : null}
    </AdminShell>
  );
}
