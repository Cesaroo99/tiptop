"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ErrorBanner, PrimaryButton } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Manage = {
  counts: { interested: number; reserved: number; confirmed: number; present: number };
  tickets: Array<{
    id: string;
    status: string;
    consumedAt: string | null;
    paid: boolean;
    holder: { id: string; firstName: string; lastName: string; username: string };
  }>;
  people: Array<{ id: string; firstName: string; lastName: string; username: string; status: string }>;
};

export default function Page() {
  return (
    <AppShell>
      <ManageView />
    </AppShell>
  );
}

function ManageView() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const [data, setData] = useState<Manage | null>(null);
  const [tab, setTab] = useState<"all" | "interested" | "reserved" | "validated">("all");
  const [note, setNote] = useState<string | null>(null);

  async function load() {
    setData(await api<Manage>(`/events/${id}/manage`));
  }

  useEffect(() => {
    void load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function validate(ticketId: string) {
    try {
      await api(`/tickets/${ticketId}/consume`, { method: "POST" });
      setNote(messages.booking.scanOk);
      await load();
    } catch (e) {
      setNote(
        e instanceof ApiError && e.code === "ALREADY_CONSUMED"
          ? messages.booking.alreadyConsumed
          : e instanceof ApiError && e.code === "ENTRY_WINDOW"
            ? messages.booking.entryClosed
            : messages.common.error,
      );
    }
  }

  if (!data) return <p className="p-4 text-sm text-muted">{messages.common.loading}</p>;

  const people =
    tab === "interested"
      ? data.people.filter((p) => p.status === "INTERESTED")
      : tab === "reserved"
        ? data.people.filter((p) => p.status === "RESERVED" || p.status === "CONFIRMED")
        : tab === "validated"
          ? data.people.filter((p) => p.status === "PRESENT")
          : data.people;

  return (
    <div className="px-4 py-4">
      <h1 className="text-lg font-semibold">{messages.booking.manageEvent}</h1>
      <Link href={`/events/${id}/scan`} className="mt-3 block rounded-pill bg-accent py-3 text-center font-semibold text-white">
        {messages.booking.validateTicket}
      </Link>
      <p className="mt-3 text-xs text-muted">
        {data.counts.interested} {messages.booking.tabInterested} · {data.counts.reserved + data.counts.confirmed} {messages.booking.tabReserved} · {data.counts.present} {messages.booking.tabValidated}
      </p>
      <div className="mt-4 flex gap-3 overflow-x-auto text-sm">
        {(["all", "interested", "reserved", "validated"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={tab === t ? "border-b-2 border-accent font-semibold text-accent" : "text-muted"}
          >
            {t === "all" ? messages.social.all : t === "interested" ? messages.booking.tabInterested : t === "reserved" ? messages.booking.tabReserved : messages.booking.tabValidated}
          </button>
        ))}
      </div>
      {note ? <p className="mt-3 text-sm text-accent">{note}</p> : null}
      <div className="mt-4 space-y-2">
        {people.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-card bg-surface p-3 shadow-card">
            <Link href={`/u/${p.username}`} className="text-sm text-accent">
              {p.firstName} {p.lastName}
            </Link>
            <span className="text-xs text-muted">{p.status}</span>
          </div>
        ))}
        {data.tickets.map((t) => (
          <div key={t.id} className="rounded-card bg-surface p-3 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                {t.holder.firstName} {t.holder.lastName}
              </p>
              <span className={`text-xs ${t.paid ? "text-success" : "text-muted"}`}>
                {t.paid ? messages.booking.paidBadge : messages.booking.unpaidBadge}
              </span>
            </div>
            {t.status === "CONFIRMED" ? (
              <PrimaryButton className="mt-2" onClick={() => void validate(t.id)}>
                {messages.booking.validateTicket}
              </PrimaryButton>
            ) : (
              <p className="mt-1 text-xs text-muted">{t.status}</p>
            )}
          </div>
        ))}
      </div>
      {people.length === 0 && data.tickets.length === 0 ? <ErrorBanner message={messages.home.emptyBody} /> : null}
    </div>
  );
}
