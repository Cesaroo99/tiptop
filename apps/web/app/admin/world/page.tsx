"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Mission = {
  id: string;
  title: string;
  description: string;
  category: string;
  durationHours: number | null;
  reward: string;
  status: string;
};

export default function Page() {
  const [items, setItems] = useState<Mission[]>([]);
  const [title, setTitle] = useState("Découvre une nouvelle activité ce week-end.");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("discovery");
  const [reward, setReward] = useState("Badge explorateur");
  const [msg, setMsg] = useState("");

  async function load() {
    const data = await api<{ items: Mission[] }>("/admin/world-missions");
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
  }, []);

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">Activer / désactiver une mission sans toucher au code.</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2 w-full rounded-pill border border-[var(--border)] px-3 py-2 text-sm" />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mb-2 w-full rounded-card border border-[var(--border)] px-3 py-2 text-sm" rows={3} />
      <div className="mb-2 flex gap-2">
        <input value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-pill border border-[var(--border)] px-3 py-2 text-sm" />
        <input value={reward} onChange={(e) => setReward(e.target.value)} className="flex-1 rounded-pill border border-[var(--border)] px-3 py-2 text-sm" />
      </div>
      <button
        type="button"
        className="rounded-pill bg-accent px-4 py-2 text-sm text-on-primary"
        onClick={() =>
          void api("/admin/world-missions", {
            method: "POST",
            body: JSON.stringify({ title, description, category, reward, status: "ACTIVE" }),
          })
            .then(() => {
              setMsg("Mission créée");
              return load();
            })
            .catch(() => setMsg("Permission world.write requise"))
        }
      >
        Créer / activer
      </button>
      {msg ? <p className="mt-2 text-xs text-accent">{msg}</p> : null}
      <div className="mt-4 space-y-2">
        {items.map((m) => (
          <article key={m.id} className="rounded-card bg-surface p-4 shadow-card">
            <p className="font-semibold">{m.title}</p>
            <p className="text-xs text-muted">
              {m.category} · {m.status} · {m.reward}
            </p>
            <button
              type="button"
              className="mt-2 text-xs underline"
              onClick={() =>
                void api("/admin/world-missions", {
                  method: "POST",
                  body: JSON.stringify({ id: m.id, title: m.title, category: m.category, status: m.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }),
                }).then(() => load())
              }
            >
              {m.status === "ACTIVE" ? "Désactiver" : "Activer"}
            </button>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
