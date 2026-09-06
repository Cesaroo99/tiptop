"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ageCategoryLabel, canInteractWithEvent, eventLifecycle, mapsDirectionsUrl } from "@tiptop/domain";
import { api, ApiError, type CommentItem, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { formatCompactCount, formatCountdownLabel, formatFcfa, formatRelative, splitPostLead } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { BookEventSheet } from "./BookEventSheet";
import { CommentThread } from "./CommentThread";
import {
  CalendarIcon,
  CameraIcon,
  CommentIcon,
  FlagIcon,
  GlobeIcon,
  HeartIcon,
  LinkIcon,
  MoreIcon,
  PlusIcon,
  ShareIcon,
} from "./Icons";
import { MapThumb } from "./MapThumb";
import { OptionsSheet } from "./OptionsSheet";
import { ReportModal } from "./ReportModal";
import { seatsRemainingOf } from "./SeatsLeftBadge";
import { IconButton, Modal, TextInput } from "./ui";

export function EventDetailCard({
  event,
  onChanged,
  variant = "guest",
  onHostDuplicate,
  onHostCancel,
}: {
  event: EventCardType;
  onChanged?: (next: EventCardType) => void;
  variant?: "guest" | "host";
  onHostDuplicate?: () => void;
  onHostCancel?: () => void;
}) {
  const { messages } = useI18n();
  const router = useRouter();
  const hostView = variant === "host";
  const [transfer, setTransfer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

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
    await api<{ interested: boolean }>(`/events/${event.id}/interested`, { method: "POST" });
    onChanged?.(await api<EventCardType>(`/events/${event.id}`));
  }

  async function share() {
    const url = `${window.location.origin}/events/${event.id}`;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  const relative = formatRelative(event.createdAt ?? event.startsAt, messages.social);
  const lifecycle = eventLifecycle(
    new Date(event.startsAt),
    event.endsAt ? new Date(event.endsAt) : null,
    new Date(),
    event.status,
  );
  const interactive = canInteractWithEvent(lifecycle.phase);
  const remaining = seatsRemainingOf(event.capacity, event.reservedCount ?? event.taken, event.remaining);
  const countdown = formatCountdownLabel(event.startsAt);
  const body = event.description ? `${event.title} : ${event.description}` : event.title;
  const { lead, rest } = splitPostLead(body);
  const priceLabel =
    event.priceXaf > 0
      ? event.currency === "XAF" || !event.currency
        ? formatFcfa(event.priceXaf)
        : messages.world.paid.replace("{amount}", formatFcfa(event.priceXaf))
      : messages.world.free;
  const mapsUrl = mapsDirectionsUrl({
    city: event.city,
    zone: event.zone,
    placeName: event.venue,
  });
  const stats = hostView
    ? [
        `${formatCompactCount(event.commentsCount ?? 0)} ${messages.social.comments}`,
        `${formatCompactCount(event.reservedCount ?? event.taken)} ${messages.world.reservationsCount}`,
      ]
    : [
        `${formatCompactCount(event.commentsCount ?? 0)} ${messages.social.comments}`,
        `${formatCompactCount(event.reservedCount ?? event.taken)} ${messages.world.reservationsCount}`,
        `${formatCompactCount(event.interestedCount ?? 0)} ${messages.world.interestedCount}`,
      ];
  const age = ageCategoryLabel(event.minAge);

  return (
    <article className="overflow-hidden rounded-card bg-surface px-3.5 py-3.5 shadow-card">
      <div className="flex items-start gap-2.5">
        <Link href={`/u/${event.host.username}`} className="shrink-0">
          <Avatar
            src={event.host.avatarUrl}
            firstName={event.host.firstName}
            lastName={event.host.lastName}
            size="md"
            online={event.people?.find((p) => p.id === event.host.id)?.available}
          />
        </Link>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center gap-1.5">
            <Link href={`/u/${event.host.username}`} className="type-body-sm truncate font-bold text-ink">
              {event.host.firstName} {event.host.lastName}
            </Link>
            {event.host.certified ? <CertifiedMark /> : null}
            {age ? (
              <span className="type-caption shrink-0 rounded-full bg-danger px-2 py-0.5 font-bold leading-none text-white">
                {age}
              </span>
            ) : null}
          </div>
          <p className="type-caption mt-0.5 flex items-center gap-1 text-muted">
            <GlobeIcon size={12} />
            <span>{relative}</span>
          </p>
        </div>
        <button
          type="button"
          aria-label={messages.social.share}
          onClick={() => void share()}
          className="tap-scale mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent transition hover:brightness-95"
        >
          <ShareIcon size={15} />
        </button>
        <IconButton label={messages.social.moreOptions} onClick={() => setOptionsOpen(true)} size={36} className="mt-0.5">
          <MoreIcon size={16} />
        </IconButton>
      </div>

      <p className="type-body-sm mt-3 text-ink">
        {lead ? (
          <>
            <span className="font-bold">{lead}</span>
            {rest ? ` ${rest}` : null}
          </>
        ) : (
          event.title
        )}
      </p>

      <div className="relative mt-3">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.imageUrl} alt="" className="h-56 w-full rounded-xl object-cover" />
        ) : (
          <div className="grid h-40 w-full place-items-center rounded-xl bg-gradient-to-br from-accent/15 to-yellow/20 type-body-sm text-accent">
            {event.title}
          </div>
        )}
        <span className="type-caption absolute right-2 top-2 rounded-lg bg-accent px-2.5 py-1 font-bold text-white shadow-sm">
          {priceLabel}
        </span>
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`${event.city}${event.zone ? ` - ${event.zone}` : ""}`}
            className="absolute bottom-2 right-2 h-[4.25rem] w-[6.25rem]"
          >
            <MapThumb city={event.city} zone={event.zone} className="h-full w-full" />
          </a>
        ) : (
          <div className="absolute bottom-2 right-2 h-[4.25rem] w-[6.25rem]">
            <MapThumb city={event.city} zone={event.zone} className="h-full w-full" />
          </div>
        )}
      </div>

      <p className="type-caption mt-3 text-muted">{stats.join(" · ")}</p>
      {event.paymentRule === "PAY_REQUIRED" && event.priceXaf > 0 ? (
        <p className="type-caption mt-1 font-semibold text-accent">{messages.world.paymentRequired}</p>
      ) : event.paymentRule === "PAY_FIRST" && event.priceXaf > 0 ? (
        <p className="type-caption mt-1 text-muted">{messages.world.paymentFirst}</p>
      ) : null}

      {lifecycle.phase === "cancelled" ? (
        <p className="type-body-sm mt-3 rounded-lg bg-danger-soft px-3 py-2.5 font-semibold text-danger">
          {messages.world.cancelledBody}
        </p>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        {hostView ? (
          <Link
            href={`/events/${event.id}/scan`}
            className="tap-scale type-caption inline-flex items-center gap-2 rounded-pill border-2 border-accent px-3.5 py-2 font-bold uppercase tracking-wide text-accent"
          >
            <CameraIcon size={16} />
            {messages.booking.validateTicket}
          </Link>
        ) : (
          <>
        <button
          type="button"
          aria-label={messages.world.heartEvent}
          disabled={!interactive}
          onClick={() => interactive && void heart(false)}
          className={`tap-scale grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-white shadow-sm transition hover:bg-accent-hover ${!interactive ? "opacity-40" : ""}`}
        >
          <HeartIcon size={18} filled={event.viewerHearted} />
        </button>
        <button
          type="button"
          aria-label={messages.social.comments}
          disabled={!event.postId}
          onClick={() => event.postId && setCommentsOpen(true)}
          className="tap-scale grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-sunken text-muted transition hover:brightness-95 disabled:opacity-40"
        >
          <CommentIcon size={17} />
        </button>
        {!event.isHost && !event.canBook && interactive ? (
          <button
            type="button"
            onClick={() => void interested()}
            className={`tap-scale type-caption rounded-pill px-3 py-2 font-semibold transition ${event.viewerInterested ? "bg-accent text-on-primary" : "border border-border bg-surface text-ink"}`}
          >
            {event.viewerInterested ? messages.world.notInterested : messages.world.interested}
          </button>
        ) : null}
        {event.canBook ? (
          <button
            type="button"
            onClick={() => setBookOpen(true)}
            className="tap-scale type-caption rounded-pill bg-accent px-3.5 py-2 font-semibold text-on-primary shadow-sm"
          >
            {messages.booking.reserve}
          </button>
        ) : null}
        {event.viewerTicketId ? (
          <Link
            href={`/tickets/${event.viewerTicketId}`}
            className="tap-scale type-caption rounded-pill border border-border px-3 py-2 font-semibold text-ink"
          >
            {messages.booking.viewTicket}
          </Link>
        ) : null}
          </>
        )}
        {countdown && lifecycle.phase !== "ended" && lifecycle.phase !== "cancelled" ? (
          <span className="ml-auto flex min-w-0 items-center gap-1.5">
            <span className="type-caption whitespace-nowrap text-muted">{messages.world.eventInLabel}</span>
            <span className="type-caption shrink-0 rounded-full bg-yellow px-2.5 py-1 font-bold text-ink">{countdown}</span>
          </span>
        ) : lifecycle.phase === "ongoing" ? (
          <span className="type-caption ml-auto rounded-pill bg-success px-2.5 py-1 font-bold text-white">
            {messages.world.ongoingBadge}
          </span>
        ) : lifecycle.phase === "ended" ? (
          <span className="type-caption ml-auto rounded-pill bg-black/55 px-2.5 py-1 font-bold text-white">
            {messages.world.endedBadge}
          </span>
        ) : null}
      </div>
      {copied ? <p className="type-caption mt-2 text-accent">{messages.social.copied}</p> : null}

      <Modal
        open={Boolean(transfer)}
        title={messages.world.heartTransferTitle}
        onClose={() => setTransfer(null)}
        onConfirm={() => void heart(true)}
        confirmLabel={messages.common.confirm}
      >
        {messages.world.heartTransferBody.replace("{title}", transfer ?? "")}
      </Modal>
      <OptionsSheet
        open={optionsOpen}
        onClose={() => setOptionsOpen(false)}
        actions={[
          { key: "copy", label: messages.social.copyLink, icon: <LinkIcon size={17} />, onClick: () => void copyLink() },
          ...(hostView
            ? [
                {
                  key: "edit",
                  label: messages.world.manageEdit,
                  icon: <CalendarIcon size={16} />,
                  onClick: () => router.push(`/events/${event.id}/edit`),
                },
                ...(onHostDuplicate
                  ? [{ key: "dup", label: messages.world.manageDuplicate, icon: <PlusIcon size={16} />, onClick: onHostDuplicate }]
                  : []),
                ...(onHostCancel && event.status !== "CANCELLED"
                  ? [{ key: "cancel", label: messages.world.manageCancel, icon: <FlagIcon size={15} />, onClick: onHostCancel, danger: true }]
                  : []),
              ]
            : event.isHost
              ? []
              : [{ key: "report", label: messages.admin.report, icon: <FlagIcon size={15} />, onClick: () => setReportOpen(true) }]),
        ]}
      />
      <ReportModal open={reportOpen} kind="EVENT" eventId={event.id} onClose={() => setReportOpen(false)} />
      <BookEventSheet
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        onBooked={(seats) => {
          if (seats <= 0) return;
          const nextTaken = (event.reservedCount ?? event.taken) + seats;
          const nextRemaining = remaining != null ? Math.max(0, remaining - seats) : seatsRemainingOf(event.capacity, nextTaken);
          onChanged?.({
            ...event,
            taken: nextTaken,
            reservedCount: nextTaken,
            remaining: nextRemaining,
            canBook: nextRemaining == null || nextRemaining > 0 ? event.canBook : false,
          });
        }}
        preview={{
          eventId: event.id,
          title: event.title,
          body,
          startsAt: event.startsAt,
          createdAt: event.createdAt,
          minAge: event.minAge,
          author: event.host,
        }}
      />
      {event.postId ? (
        <EventCommentsSheet
          open={commentsOpen}
          postId={event.postId}
          onClose={() => setCommentsOpen(false)}
          onCount={(n) => onChanged?.({ ...event, commentsCount: n })}
        />
      ) : null}
    </article>
  );
}

function EventCommentsSheet({
  open,
  postId,
  onClose,
  onCount,
}: {
  open: boolean;
  postId: string;
  onClose: () => void;
  onCount: (n: number) => void;
}) {
  const { messages } = useI18n();
  const [items, setItems] = useState<CommentItem[] | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api<{ items: CommentItem[] }>(`/posts/${postId}/comments`)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        onCount(data.items.length);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
    // onCount est dérivé du parent — on recharge seulement à l’ouverture.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId]);

  async function send() {
    if (!text.trim()) return;
    const created = await api<CommentItem>(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: text, parentId: replyTo?.id ?? undefined }),
    });
    setItems((cur) => [...(cur ?? []), created]);
    setText("");
    setReplyTo(null);
    onCount((items?.length ?? 0) + 1);
  }

  return (
    <Modal open={open} title={messages.social.comments} onClose={onClose} hideActions>
      <div className="max-h-72 overflow-y-auto text-left">
        {items && items.length === 0 ? (
          <p className="type-body-sm text-muted">{messages.social.emptyComments}</p>
        ) : null}
        {items ? (
          <CommentThread
            items={items}
            onChange={(next) => setItems((cur) => (cur ?? []).map((c) => (c.id === next.id ? next : c)))}
            onReply={setReplyTo}
          />
        ) : null}
      </div>
      {replyTo ? (
        <p className="type-caption mt-2 text-muted">
          {messages.social.replyTo.replace("{name}", replyTo.author.firstName)}
        </p>
      ) : null}
      <div className="mt-3 flex gap-2">
        <TextInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={replyTo ? messages.social.replyTo.replace("{name}", replyTo.author.firstName) : messages.social.addComment}
          className="flex-1"
        />
        <button
          type="button"
          onClick={() => void send()}
          className="tap-scale type-button rounded-pill bg-accent px-4 text-on-primary"
        >
          OK
        </button>
      </div>
    </Modal>
  );
}

export function EventLinkedPeople({
  event,
  onChanged,
}: {
  event: EventCardType;
  onChanged: (next: EventCardType) => void;
}) {
  const { messages } = useI18n();
  const { user } = useSession();
  const people = event.people ?? [];
  const canToggle = Boolean(event.viewerStatus) && !event.isHost && event.viewerShowOnProfile != null;
  const hidden = canToggle && event.viewerShowOnProfile === false;

  async function toggle() {
    const show = !event.viewerShowOnProfile;
    await api(`/events/${event.id}/profile-visibility`, {
      method: "PATCH",
      body: JSON.stringify({ show }),
    });
    onChanged({ ...event, viewerShowOnProfile: show });
  }

  return (
    <section data-testid="event-linked-people">
      <p className="type-heading text-ink">{messages.world.peopleLinkedNamed.replace("{n}", String(people.length))}</p>
      {people.length === 0 ? (
        <p className="type-body-sm mt-2 text-muted">{messages.world.peopleLinkedEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {people.map((p) => {
            const mine = user?.id === p.id;
            const subtitle = p.profession || (p.status === "HOST" ? messages.world.host : null);
            return (
              <li key={p.id}>
                <Link
                  href={`/u/${p.username}`}
                  className="flex items-center gap-3 rounded-[22px] bg-surface-sunken px-3 py-2.5"
                >
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
                    {subtitle ? <span className="type-caption block text-muted">{subtitle}</span> : null}
                  </span>
                  {mine && hidden ? (
                    <span className="type-caption shrink-0 rounded-full bg-yellow-soft px-2 py-0.5 font-semibold text-ink">
                      {messages.world.peopleOnlyYou}
                    </span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {canToggle ? (
        <div className="mt-3">
          {hidden ? <p className="type-caption mb-2 text-muted">{messages.world.peopleHiddenHint}</p> : null}
          <button type="button" onClick={() => void toggle()} className="type-caption font-semibold text-accent">
            {event.viewerShowOnProfile ? messages.world.hideParticipation : messages.world.showParticipation}
          </button>
        </div>
      ) : null}
    </section>
  );
}
