"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { StatusDot } from "@/components/admin/StatusDot";
import { ErrorBanner, Skeleton } from "@/components/ui";
import { api } from "@/lib/api";
import { adminCopy } from "@/lib/admin-copy";
import { useI18n } from "@/lib/i18n";

type Alert = { id: string; level: string; title: string; body: string; href?: string };
type Overview = {
  users: { total: number; new7d: number; activeDaily: number; activeMonthly: number; blocked: number; deleted: number; byCountry: { country: string; count: number }[] };
  events: { active: number; upcoming: number; ended: number; pendingReview: number; reported: number; cancelled: number; suspended: number };
  ticketing: { ticketsSold: number; reservations: number; gmvXaf: number; refundedXaf: number; commissionXaf: number; toOrganizersXaf: number; provider: string };
  social: { posts: number; moods: number; comments: number; messages: number; groups: number };
  ai: { recommendations: number; plans: number; matches: number; agentSuggestions: number };
  alerts: Alert[];
  services: { id: string; status: string; label: string }[];
};

export default function Page() {
  const { messages } = useI18n();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    api<Overview>("/admin/command")
      .then(setData)
      .catch(() => {
        setData(null);
        setError(messages.common.error);
      });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminShell>
      {error ? <ErrorBanner message={error} onRetry={() => load()} /> : null}
      {!data && !error ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      ) : null}
      {data ? (
        <>
          <section className="mb-4 space-y-2">
            {data.alerts.map((a) => (
              <Link
                key={a.id}
                href={a.href ?? "/admin/services"}
                className={`block rounded-card p-3 text-sm shadow-card ${
                  a.level === "CRITICAL" ? "bg-red-50 text-red-900" : a.level === "WARNING" ? "bg-amber-50 text-amber-950" : "bg-surface"
                }`}
              >
                <p className="font-semibold">
                  {a.level === "CRITICAL" ? "🔴" : a.level === "WARNING" ? "🟠" : "ℹ️"} {a.title}
                </p>
                <p className="mt-1 text-xs opacity-80">{a.body}</p>
              </Link>
            ))}
          </section>
          <h2 className="mb-2 text-sm font-semibold">{adminCopy.users}</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat href="/admin/users" label="Total" value={data.users.total} />
            <Stat href="/admin/users" label="Nouveaux 7j" value={data.users.new7d} />
            <Stat href="/admin/analytics" label="DAU" value={data.users.activeDaily} />
            <Stat href="/admin/analytics" label="MAU" value={data.users.activeMonthly} />
            <Stat href="/admin/users" label="Suspendus" value={data.users.blocked} />
            <Stat href="/admin/users" label="Supprimés" value={data.users.deleted} />
          </div>
          {data.users.byCountry.length > 0 ? (
            <p className="mb-4 text-xs text-muted">
              Nouveaux / pays : {data.users.byCountry.map((c) => `${c.country} ${c.count}`).join(" · ")}
            </p>
          ) : null}
          <h2 className="mb-2 text-sm font-semibold">{adminCopy.events}</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat href="/admin/events" label="Actifs" value={data.events.active} />
            <Stat href="/admin/events" label="À venir" value={data.events.upcoming} />
            <Stat href="/admin/events" label="Brouillons" value={data.events.pendingReview} />
            <Stat href="/admin/events" label="Signalés" value={data.events.reported} />
            <Stat href="/admin/events" label="Terminés" value={data.events.ended} />
            <Stat href="/admin/events" label="Annulés" value={data.events.cancelled} />
          </div>
          <h2 className="mb-2 text-sm font-semibold">Billetterie (mock)</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat href="/admin/tickets" label="Billets" value={data.ticketing.ticketsSold} />
            <Stat href="/admin/tickets" label="Réservations" value={data.ticketing.reservations} />
            <Stat href="/admin/finance" label="GMV XAF" value={data.ticketing.gmvXaf} />
            <Stat href="/admin/refunds" label="Remboursés" value={data.ticketing.refundedXaf} />
            <Stat href="/admin/finance" label="Commission" value={data.ticketing.commissionXaf} />
            <Stat href="/admin/finance" label="Dû orga." value={data.ticketing.toOrganizersXaf} />
          </div>
          <h2 className="mb-2 text-sm font-semibold">Social / IA</h2>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat href="/admin/posts" label="Posts" value={data.social.posts} />
            <Stat href="/admin/moods" label="Moods" value={data.social.moods} />
            <Stat href="/admin/ai" label="Recos" value={data.ai.recommendations} />
            <Stat href="/admin/ai" label="Plans" value={data.ai.plans} />
            <Stat href="/admin/world" label="Matchs" value={data.ai.matches} />
            <Stat href="/admin/ai" label="Agent" value={data.ai.agentSuggestions} />
          </div>
          <h2 className="mb-2 text-sm font-semibold">Services (tests réels)</h2>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {data.services.map((s) => (
              <Link key={s.id} href="/admin/services" className="flex items-center justify-between rounded-card bg-surface px-3 py-2 shadow-card">
                <span className="text-sm">{s.label}</span>
                <StatusDot status={s.status} />
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </AdminShell>
  );
}

function Stat({ href, label, value }: { href: string; label: string; value: number }) {
  return (
    <Link href={href} className="rounded-card bg-surface p-4 shadow-card">
      <p className="text-2xl font-semibold text-accent">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </Link>
  );
}
