"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CalendarIcon, PlusIcon } from "@/components/Icons";
import { Chip, EmptyState, Modal, PrimaryButton, ScreenHeader, SecondaryButton, TextInput } from "@/components/ui";
import { api, ApiError, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatEventWhen } from "@/lib/time";

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
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [event, setEvent] = useState<EventCardType | null>(null);
  const [data, setData] = useState<Manage | null>(null);
  const [tab, setTab] = useState<"all" | "interested" | "reserved" | "validated">("all");
  const [note, setNote] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [e, m] = await Promise.all([
      api<EventCardType>(`/events/${id}`),
      api<Manage>(`/events/${id}/manage`),
    ]);
    setEvent(e);
    setData(m);
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

  async function cancelEvent() {
    setBusy(true);
    try {
      await api(`/events/${id}/cancel`, { method: "POST" });
      setCancelOpen(false);
      await load();
    } catch {
      setNote(messages.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function duplicateEvent() {
    if (!duplicateDate) return;
    setBusy(true);
    try {
      const created = await api<EventCardType>(`/events/${id}/duplicate`, {
        method: "POST",
        body: JSON.stringify({ startsAt: new Date(duplicateDate).toISOString() }),
      });
      router.push(`/events/${created.id}/edit`);
    } catch {
      setNote(messages.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (!event || !data) return <p className="type-body-sm p-4 text-muted">{messages.common.loading}</p>;

  const holderIds = new Set(data.tickets.map((t) => t.holder.id));
  const people =
    tab === "interested"
      ? data.people.filter((p) => p.status === "INTERESTED")
      : tab === "reserved" || tab === "validated"
        ? []
        : data.people.filter((p) => p.status === "INTERESTED" || !holderIds.has(p.id));
  const tickets =
    tab === "interested"
      ? []
      : tab === "reserved"
        ? data.tickets.filter((t) => t.status === "CONFIRMED" || t.status === "AWAITING_PAYMENT")
        : tab === "validated"
          ? data.tickets.filter((t) => t.status === "CONSUMED")
          : data.tickets;

  const cancelled = event.status === "CANCELLED";

  return (
    <div className="px-4 py-4">
      <ScreenHeader title={messages.booking.manageEvent} onBack={() => router.back()} />
      <div className="rounded-card bg-surface p-4 shadow-card">
        <p className="type-heading text-ink">{event.title}</p>
        <p className="type-body-sm mt-1 text-muted">
          {formatEventWhen(event.startsAt, locale)} · {event.city}
          {event.zone ? ` - ${event.zone}` : ""}
        </p>
        <div className="mt-2">
          <Chip tone={cancelled ? "danger" : event.status === "ENDED" ? "neutral" : "success"}>
            {cancelled ? messages.world.cancelledBadge : event.status === "ENDED" ? messages.world.endedBadge : messages.world.available}
          </Chip>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {cancelled ? (
          <SecondaryButton disabled>{messages.world.manageEdit}</SecondaryButton>
        ) : (
          <Link href={`/events/${id}/edit`}>
            <SecondaryButton>{messages.world.manageEdit}</SecondaryButton>
          </Link>
        )}
        <SecondaryButton onClick={() => setDuplicateOpen(true)}>
          <span className="inline-flex items-center justify-center gap-2">
            <PlusIcon size={15} />
            {messages.world.manageDuplicate}
          </span>
        </SecondaryButton>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Link href={`/events/${id}/scan`}>
          <PrimaryButton>
            <span className="inline-flex items-center justify-center gap-2">
              <CalendarIcon size={15} />
              {messages.booking.validateTicket}
            </span>
          </PrimaryButton>
        </Link>
        <button
          type="button"
          disabled={cancelled}
          onClick={() => setCancelOpen(true)}
          className="tap-scale type-button rounded-pill border border-danger/40 bg-danger-soft py-3.5 text-danger transition hover:bg-danger/15 disabled:opacity-40"
        >
          {messages.world.manageCancel}
        </button>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        <Chip tone="info">{data.counts.interested} {messages.booking.tabInterested}</Chip>
        <Chip tone="success">{data.counts.reserved + data.counts.confirmed} {messages.booking.tabReserved}</Chip>
        <Chip>{data.counts.present} {messages.booking.tabValidated}</Chip>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto">
        {(["all", "interested", "reserved", "validated"] as const).map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t === "all" ? messages.social.all : t === "interested" ? messages.booking.tabInterested : t === "reserved" ? messages.booking.tabReserved : messages.booking.tabValidated}
          </Chip>
        ))}
      </div>
      {note ? <p className="type-body-sm mt-3 font-semibold text-accent">{note}</p> : null}
      <div className="mt-4 space-y-2">
        {people.map((p) => (
          <div key={p.id} className="flex items-center justify-between rounded-card bg-surface p-3.5 shadow-xs">
            <Link href={`/u/${p.username}`} className="type-body-sm font-semibold text-accent">
              {p.firstName} {p.lastName}
            </Link>
            <Chip>{p.status}</Chip>
          </div>
        ))}
        {tickets.map((t) => (
          <div key={t.id} className="rounded-card bg-surface p-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="type-body-sm text-ink">
                {t.holder.firstName} {t.holder.lastName}
              </p>
              <Chip tone={t.paid ? "success" : "neutral"}>{t.paid ? messages.booking.paidBadge : messages.booking.unpaidBadge}</Chip>
            </div>
            {t.status === "CONFIRMED" ? (
              <PrimaryButton className="mt-2" onClick={() => void validate(t.id)}>
                {messages.booking.validateTicket}
              </PrimaryButton>
            ) : (
              <p className="type-caption mt-1 text-muted">{t.status}</p>
            )}
          </div>
        ))}
        {people.length === 0 && tickets.length === 0 ? (
          <EmptyState title={messages.booking.manageEvent} body={messages.home.emptyBody} />
        ) : null}
      </div>

      <Modal
        open={cancelOpen}
        title={messages.world.manageCancel}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => void cancelEvent()}
        confirmLabel={busy ? messages.common.loading : messages.world.manageCancel}
        danger
      >
        {messages.world.manageCancelConfirm}
      </Modal>
      <Modal
        open={duplicateOpen}
        title={messages.world.manageDuplicate}
        onClose={() => setDuplicateOpen(false)}
        onConfirm={() => void duplicateEvent()}
        confirmLabel={busy ? messages.common.loading : messages.world.manageDuplicate}
      >
        <p className="mb-3">{messages.world.manageDuplicatePrompt}</p>
        <TextInput type="datetime-local" value={duplicateDate} onChange={(e) => setDuplicateDate(e.target.value)} />
      </Modal>
    </div>
  );
}
