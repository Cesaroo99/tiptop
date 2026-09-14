"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

export default function Page() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "organizers" | "active" | "inactive">("active");
  const [confirm, setConfirm] = useState(false);
  const [items, setItems] = useState<Array<{ id: string; title: string; sentCount: number; status: string }>>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<{ items: typeof items }>("/admin/campaigns")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  async function send(test = false) {
    setMsg("");
    try {
      const res = await api<{ sentCount: number; channel: string }>("/admin/campaigns", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          audience,
          confirmBroadcast: confirm,
          testUserId: test ? undefined : undefined,
        }),
      });
      setMsg(`Envoyé ${res.sentCount} · canal ${res.channel} (in-app, pas FCM)`);
    } catch {
      setMsg("Échec — permission ou confirmation « tous » manquante.");
    }
  }

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">Canal actuel : notifications in-app. FCM n’existe pas. Envoi à tous exige une case de confirmation.</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre" className="mb-2 w-full rounded-pill border border-[var(--border)] px-3 py-2 text-sm" />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" className="mb-2 w-full rounded-card border border-[var(--border)] px-3 py-2 text-sm" rows={4} />
      <select value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} className="mb-2 rounded-pill border border-[var(--border)] px-3 py-2 text-sm">
        <option value="active">Actifs 7j</option>
        <option value="inactive">Inactifs 30j</option>
        <option value="organizers">Organisateurs</option>
        <option value="all">Tous</option>
      </select>
      {audience === "all" ? (
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
          Je confirme l’envoi à tous les comptes actifs
        </label>
      ) : null}
      <button type="button" className="rounded-pill bg-accent px-4 py-2 text-sm text-on-primary" onClick={() => void send(false)}>
        Envoyer
      </button>
      {msg ? <p className="mt-2 text-xs text-accent">{msg}</p> : null}
      <h2 className="mt-6 text-sm font-semibold">Historique</h2>
      {items.map((c) => (
        <p key={c.id} className="text-xs text-muted">
          {c.title} · {c.status} · {c.sentCount}
        </p>
      ))}
    </AdminShell>
  );
}
