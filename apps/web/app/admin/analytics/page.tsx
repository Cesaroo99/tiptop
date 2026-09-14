"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type A = {
  acquisition: { signups30d: number };
  engagement: { dau: number; wau: number; mau: number; savedEvents30d: number };
  conversion: { reservations30d: number; payments30d: number; reservationToPay: number };
  realWorld: { attended30d: number; aiPlans30d: number; recommendations30d: number; recommendationToExperience: number };
};

export default function Page() {
  const [data, setData] = useState<A | null>(null);

  useEffect(() => {
    api<A>("/admin/analytics")
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
      <p className="mb-3 text-sm text-muted">TipTop mesure l’impact réel, pas seulement le temps passé dans l’app.</p>
      <h2 className="mb-2 text-sm font-semibold">Acquisition</h2>
      <Grid items={[["Inscriptions 30j", data.acquisition.signups30d]]} />
      <h2 className="mb-2 mt-4 text-sm font-semibold">Engagement</h2>
      <Grid
        items={[
          ["DAU", data.engagement.dau],
          ["WAU", data.engagement.wau],
          ["MAU", data.engagement.mau],
          ["Sorties sauvées", data.engagement.savedEvents30d],
        ]}
      />
      <h2 className="mb-2 mt-4 text-sm font-semibold">Conversion</h2>
      <Grid
        items={[
          ["Réservations", data.conversion.reservations30d],
          ["Paiements", data.conversion.payments30d],
          ["Résa → paiement", data.conversion.reservationToPay],
        ]}
      />
      <h2 className="mb-2 mt-4 text-sm font-semibold">Impact réel</h2>
      <Grid
        items={[
          ["Participations", data.realWorld.attended30d],
          ["Plans IA", data.realWorld.aiPlans30d],
          ["Recos", data.realWorld.recommendations30d],
          ["Reco → expérience", data.realWorld.recommendationToExperience],
        ]}
      />
    </AdminShell>
  );
}

function Grid({ items }: { items: Array<[string, number]> }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-card bg-surface p-4 shadow-card">
          <p className="text-xl font-semibold text-accent">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      ))}
    </div>
  );
}
