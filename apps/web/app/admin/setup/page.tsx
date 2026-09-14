"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { StatusDot } from "@/components/admin/StatusDot";
import { api } from "@/lib/api";
import type { ServiceProbe } from "@tiptop/domain";

export default function Page() {
  const [services, setServices] = useState<ServiceProbe[]>([]);
  const [env, setEnv] = useState<Array<{ key: string; required: boolean; present: boolean; masked: string; note?: string }>>([]);

  useEffect(() => {
    Promise.all([api<ServiceProbe[]>("/admin/services"), api<{ items: typeof env }>("/admin/setup")])
      .then(([s, e]) => {
        setServices(s);
        setEnv(e.items);
      })
      .catch(() => undefined);
  }, []);

  const steps = [
    { title: "1. Cœur TipTop", ids: ["postgres", "sessions", "otp"] },
    { title: "2. Paiements", ids: ["stripe_payments", "tiptop_webhook"] },
    { title: "3. Cartes", ids: ["nominatim", "google_maps"] },
    { title: "4. IA", ids: ["openai"] },
    { title: "5. Firebase (hors stack)", ids: ["firebase_auth", "firestore", "fcm"] },
  ];

  return (
    <AdminShell>
      <p className="mb-4 text-sm text-muted">L’assistant détecte la config. Les secrets complets ne s’affichent jamais.</p>
      {steps.map((step) => (
        <section key={step.title} className="mb-4 rounded-card bg-surface p-4 shadow-card">
          <h2 className="font-semibold">{step.title}</h2>
          {step.ids.map((id) => {
            const s = services.find((x) => x.id === id);
            return (
              <div key={id} className="mt-2 flex items-start justify-between gap-3 text-sm">
                <div>
                  <p>{s?.label ?? id}</p>
                  <p className="text-xs text-muted">{s?.message}</p>
                </div>
                <StatusDot status={s?.status ?? "disabled"} />
              </div>
            );
          })}
        </section>
      ))}
      <h2 className="mb-2 text-sm font-semibold">Variables</h2>
      {env.map((e) => (
        <p key={e.key} className="font-mono text-xs">
          {e.key} {e.required ? "*" : ""} · {e.present ? e.masked || "oui" : "manquante"} {e.note ? `· ${e.note}` : ""}
        </p>
      ))}
    </AdminShell>
  );
}
