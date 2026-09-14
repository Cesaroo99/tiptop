"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Ai = {
  limits: {
    recommendationsEnabled: boolean;
    plannerEnabled: boolean;
    matchingEnabled: boolean;
    agentEnabled: boolean;
    maxGenerationsPerUserDay: number;
    maxBudgetXafPerUser: number;
    dailyCallBudget: number;
  };
  provider: string;
  model: string;
  configured: boolean;
  maskedKey: string;
  usage: { day: { calls: number; recommendations: number; plans: number; matches: number; agent: number }; estimatedCostUsd: number };
  overBudget: boolean;
};

export default function Page() {
  const [data, setData] = useState<Ai | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    setData(await api<Ai>("/admin/ai"));
  }

  useEffect(() => {
    void load().catch(() => setData(null));
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
      <p className={`mb-3 rounded-card p-3 text-sm ${data.configured ? "bg-emerald-50" : "bg-amber-50"}`}>
        Provider : {data.provider} · modèle {data.model} · clé {data.maskedKey || "absente"}
        {data.configured ? "" : " — Intelligence = règles domaine, pas de LLM."}
      </p>
      {data.overBudget ? <p className="mb-3 text-sm text-red-700">Budget d’appels journalier dépassé.</p> : null}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card label="Appels 24h" value={data.usage.day.calls} />
        <Card label="Coût estimé USD" value={data.usage.estimatedCostUsd} />
        <Card label="Recos" value={data.usage.day.recommendations} />
        <Card label="Plans" value={data.usage.day.plans} />
        <Card label="Matching" value={data.usage.day.matches} />
        <Card label="Agent" value={data.usage.day.agent} />
      </div>
      {(
        [
          ["recommendationsEnabled", "Recommandations"],
          ["plannerEnabled", "Experience Planner"],
          ["matchingEnabled", "Matching"],
          ["agentEnabled", "Personal AI Agent"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="mb-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={data.limits[key]}
            onChange={(e) => {
              const next = { ...data.limits, [key]: e.target.checked };
              void api("/admin/ai", { method: "PATCH", body: JSON.stringify(next) })
                .then(() => {
                  setMsg("Limites enregistrées");
                  return load();
                })
                .catch(() => setMsg("Permission ai.write requise"));
            }}
          />
          {label}
        </label>
      ))}
      <label className="mt-3 block text-sm">
        Budget appels / jour
        <input
          type="number"
          defaultValue={data.limits.dailyCallBudget}
          className="mt-1 w-32 rounded-pill border border-[var(--border)] px-3 py-2"
          onBlur={(e) =>
            void api("/admin/ai", { method: "PATCH", body: JSON.stringify({ ...data.limits, dailyCallBudget: Number(e.target.value) }) })
              .then(() => setMsg("Budget enregistré"))
              .catch(() => setMsg("Permission refusée"))
          }
        />
      </label>
      {msg ? <p className="mt-2 text-xs text-accent">{msg}</p> : null}
    </AdminShell>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card bg-surface p-4 shadow-card">
      <p className="text-xl font-semibold text-accent">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
