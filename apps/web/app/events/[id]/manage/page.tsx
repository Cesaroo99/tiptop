"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { filterHostPeople, hostPeopleCounts, type HostPeopleTab } from "@tiptop/domain";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { EventDetailCard } from "@/components/EventDetailCard";
import { EmptyState, ErrorBanner, Modal, ScreenHeader, TextInput } from "@/components/ui";
import { api, type EventCard as EventCardType, type EventManage, type EventManagePerson } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell chrome="nav">
      <ManageView />
    </AppShell>
  );
}

function ManageView() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const [event, setEvent] = useState<EventCardType | null>(null);
  const [data, setData] = useState<EventManage | null>(null);
  const [tab, setTab] = useState<HostPeopleTab>("all");
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [e, m] = await Promise.all([
        api<EventCardType>(`/events/${id}`),
        api<EventManage>(`/events/${id}/manage`),
      ]);
      setEvent(e);
      setData(m);
      setError(null);
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const counts = useMemo(() => hostPeopleCounts(data?.people ?? []), [data?.people]);
  const visible = useMemo(() => filterHostPeople(data?.people ?? [], tab), [data?.people, tab]);

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

  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (!event || !data) return <p className="type-body-sm p-4 text-muted">{messages.common.loading}</p>;

  const tabs: Array<{ id: HostPeopleTab; label: string }> = [
    { id: "all", label: messages.booking.tabAllNamed.replace("{n}", String(counts.all)) },
    { id: "interested", label: messages.booking.tabInterestedNamed.replace("{n}", String(counts.interested)) },
    { id: "reserved", label: messages.booking.tabReservedNamed.replace("{n}", String(counts.reserved)) },
    { id: "validated", label: messages.booking.tabValidatedNamed.replace("{n}", String(counts.validated)) },
  ];

  return (
    <div>
      <ScreenHeader title={event.title} onBack={() => router.back()} />
      <div className="space-y-4 px-4 pb-4">
        <EventDetailCard
          event={event}
          onChanged={setEvent}
          variant="host"
          onHostDuplicate={() => setDuplicateOpen(true)}
          onHostCancel={() => setCancelOpen(true)}
        />
        {note ? <p className="type-body-sm font-semibold text-accent">{note}</p> : null}
        <div className="h-px bg-divider" />
        <div className="no-scrollbar flex gap-4 overflow-x-auto border-b border-divider">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`type-caption shrink-0 pb-2 font-bold ${tab === t.id ? "border-b-2 border-accent text-ink" : "text-muted"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <HostPeopleList people={visible} />
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

export function HostPeopleList({ people }: { people: EventManagePerson[] }) {
  const { messages } = useI18n();
  if (people.length === 0) {
    return <EmptyState title={messages.booking.manageEvent} body={messages.booking.hostPeopleEmpty} />;
  }
  return (
    <ul data-testid="host-people" className="space-y-2">
      {people.map((p) => (
        <li key={p.id}>
          <Link href={`/u/${p.username}`} className="flex items-center gap-3 rounded-[22px] bg-surface-sunken px-3 py-2.5">
            <Avatar
              src={p.avatarUrl}
              firstName={p.firstName}
              lastName={p.lastName}
              size="md"
              online={p.available}
            />
            <span className="min-w-0 flex-1">
              <span className="type-body-sm flex items-center gap-1 font-bold text-ink">
                {p.firstName} {p.lastName}
                {p.certified ? <CertifiedMark /> : null}
              </span>
              {p.profession ? <span className="type-caption block text-muted">{p.profession}</span> : null}
            </span>
            <span
              className={`type-caption shrink-0 rounded-md px-2 py-1 font-bold text-white ${p.paid ? "bg-success" : "bg-[#4a4f57]"}`}
            >
              {p.paid ? messages.booking.paidBadge : messages.booking.unpaidBadge}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
