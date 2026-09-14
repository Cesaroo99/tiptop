"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

export default function Page() {
  const [data, setData] = useState<{ blockedPairs: number; openMessageReports: number; policy: string } | null>(null);

  useEffect(() => {
    api<typeof data>("/admin/messaging")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">
        Pas d’accès généralisé au chat. Toute lecture exceptionnelle devrait être justifiée, journalisée et réservée — elle n’est pas offerte ici.
      </p>
      {data ? (
        <div className="space-y-2">
          <p className="rounded-card bg-surface p-4 shadow-card">Paires bloquées : {data.blockedPairs}</p>
          <p className="rounded-card bg-surface p-4 shadow-card">Signalements messages ouverts : {data.openMessageReports}</p>
          <p className="text-xs text-muted">{data.policy}</p>
        </div>
      ) : (
        <p className="text-sm text-muted">Permission messages.reports requise.</p>
      )}
    </AdminShell>
  );
}
