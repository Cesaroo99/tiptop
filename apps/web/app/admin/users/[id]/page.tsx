"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Dossier = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  certified: boolean;
  organizerStatus: string;
  salesBlocked: boolean;
  createdAt: string;
  lastSeenAt: string | null;
  phoneMasked: string;
  phoneE164?: string;
  country: string | null;
  city: string | null;
  protected: boolean;
  counts: Record<string, number>;
  aiConsent: Record<string, unknown> | null;
  payments: Array<{ id: string; status: string; amountXaf: number; kind: string }>;
  audits: Array<{ id: string; action: string; createdAt: string; actor: { username: string } }>;
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const [data, setData] = useState<Dossier | null>(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setData(await api<Dossier>(`/admin/users/${id}/dossier`));
    } catch {
      setErr(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function patch(body: Record<string, unknown>) {
    setErr("");
    try {
      await api(`/admin/users/${id}/staff`, { method: "PATCH", body: JSON.stringify(body) });
      await load();
    } catch {
      setErr(messages.admin.forbidden);
    }
  }

  if (!data) {
    return (
      <AdminShell>
        <p className="text-sm text-muted">{err || messages.common.loading}</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {err ? <p className="mb-2 text-sm text-red-600">{err}</p> : null}
      <article className="rounded-card bg-surface p-4 shadow-card">
        <h1 className="text-lg font-semibold">
          {data.firstName} {data.lastName} @{data.username}
        </h1>
        <p className="mt-1 text-xs text-muted">
          {data.role} · {data.status} · {data.phoneMasked}
          {data.phoneE164 ? ` · ${data.phoneE164}` : ""} · {data.city ?? "—"}
        </p>
        <p className="mt-1 text-xs text-muted">
          Inscrit {data.createdAt.slice(0, 10)} · Vu {data.lastSeenAt?.slice(0, 16) ?? "—"} · orga {data.organizerStatus}
        </p>
        {data.protected ? <p className="mt-2 text-xs text-accent">Compte démo protégé — blocage / rôle interdits.</p> : null}
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <Btn onClick={() => void patch({ certified: !data.certified })}>{data.certified ? "Retirer certif" : "Certifier"}</Btn>
          <Btn onClick={() => void patch({ status: data.status === "BLOCKED" ? "ACTIVE" : "BLOCKED" })}>
            {data.status === "BLOCKED" ? "Réactiver" : "Suspendre"}
          </Btn>
          <Btn onClick={() => void patch({ revokeSessions: true })}>Forcer déconnexion</Btn>
          <Btn onClick={() => void patch({ salesBlocked: !data.salesBlocked })}>
            {data.salesBlocked ? "Autoriser ventes" : "Bloquer ventes"}
          </Btn>
          {["VERIFIED", "RESTRICTED", "SUSPENDED", "PENDING"].map((s) => (
            <Btn key={s} onClick={() => void patch({ organizerStatus: s })}>
              Orga {s}
            </Btn>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          Sorties {data.counts.hostedEvents} · résa {data.counts.reservations} · billets {data.counts.tickets} ·
          signalements {data.counts.reportsAbout}
        </p>
        {data.aiConsent ? (
          <p className="mt-2 text-xs text-muted">Consentement IA enregistré (pas de données de chat privé).</p>
        ) : (
          <p className="mt-2 text-xs text-muted">Pas encore de consentement IA.</p>
        )}
      </article>
      <h2 className="mt-4 text-sm font-semibold">Paiements</h2>
      {data.payments.map((p) => (
        <p key={p.id} className="text-xs text-muted">
          {p.kind} {p.amountXaf} · {p.status}
        </p>
      ))}
      <h2 className="mt-4 text-sm font-semibold">Actions admin</h2>
      {data.audits.map((a) => (
        <p key={a.id} className="text-xs text-muted">
          {a.createdAt.slice(0, 16)} · {a.actor.username} · {a.action}
        </p>
      ))}
    </AdminShell>
  );
}

function Btn({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className="rounded-pill bg-[var(--border)] px-3 py-2" onClick={onClick}>
      {children}
    </button>
  );
}
