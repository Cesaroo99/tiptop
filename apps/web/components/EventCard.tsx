"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Modal } from "./ui";

export function EventCard({
  event,
  onChanged,
}: {
  event: EventCardType;
  onChanged?: (next: EventCardType) => void;
}) {
  const { messages } = useI18n();
  const [transfer, setTransfer] = useState<string | null>(null);
  const [soon, setSoon] = useState<string | null>(null);

  async function heart(confirmTransfer = false) {
    try {
      if (event.viewerHearted) {
        await api(`/events/${event.id}/heart`, { method: "DELETE" });
        onChanged?.({ ...event, viewerHearted: false, hearts: Math.max(0, event.hearts - 1) });
        return;
      }
      await api(`/events/${event.id}/heart`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      onChanged?.({ ...event, viewerHearted: true, hearts: event.hearts + 1 });
      setTransfer(null);
    } catch (e) {
      if (e instanceof ApiError && String(e.code).includes("TRANSFER")) {
        const preview = await api<{ wouldTransferFrom: { title: string } | null }>(
          `/events/${event.id}/heart/preview`,
        );
        setTransfer(preview.wouldTransferFrom?.title ?? "…");
      }
    }
  }

  async function interested() {
    const res = await api<{ interested: boolean }>(`/events/${event.id}/interested`, { method: "POST" });
    onChanged?.({ ...event, viewerInterested: res.interested });
  }

  const when = new Date(event.startsAt).toLocaleString();
  const price = event.priceXaf > 0 ? messages.world.paid.replace("{amount}", String(event.priceXaf)) : messages.world.free;

  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card">
      <Link href={`/events/${event.id}`} className="block">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="h-40 w-full object-cover" />
        ) : (
          <div className="grid h-28 place-items-center bg-accent/10 text-sm text-accent">{messages.world.sortie}</div>
        )}
      </Link>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-yellow px-2 py-0.5 text-[11px] font-bold text-ink">{messages.world.sortie}</span>
          {event.minAge ? <span className="text-[11px] text-muted">-{event.minAge}</span> : null}
        </div>
        <Link href={`/events/${event.id}`} className="mt-2 block font-semibold text-accent">
          {event.title}
        </Link>
        <p className="text-xs text-muted">
          {when} · {event.city}
          {event.zone ? ` - ${event.zone}` : ""} · {price}
        </p>
        <p className="mt-1 text-xs text-muted">
          {messages.world.host} {event.host.firstName} {event.host.lastName}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            aria-label={messages.world.heartEvent}
            onClick={() => void heart(false)}
            className={`grid h-10 w-10 place-items-center rounded-full ${event.viewerHearted ? "bg-accent text-white" : "bg-[var(--border)] text-muted"}`}
          >
            ♥
          </button>
          {!event.isHost ? (
            <button
              type="button"
              onClick={() => void interested()}
              className={`rounded-pill px-4 py-2 text-sm font-semibold ${event.viewerInterested ? "bg-accent text-white" : "bg-[var(--border)]"}`}
            >
              {event.viewerInterested ? messages.world.notInterested : messages.world.interested}
            </button>
          ) : null}
          {event.priceXaf > 0 ? (
            <button
              type="button"
              className="rounded-pill bg-[var(--border)] px-4 py-2 text-sm"
              onClick={() => setSoon(messages.world.bookLater)}
            >
              {messages.world.tabReservations}
            </button>
          ) : null}
        </div>
      </div>
      <Modal
        open={Boolean(transfer)}
        title={messages.world.heartTransferTitle}
        onClose={() => setTransfer(null)}
        onConfirm={() => void heart(true)}
        confirmLabel={messages.common.confirm}
      >
        {messages.world.heartTransferBody.replace("{title}", transfer ?? "")}
      </Modal>
      <Modal open={Boolean(soon)} title={messages.world.sortie} onClose={() => setSoon(null)}>
        {soon}
      </Modal>
    </article>
  );
}
