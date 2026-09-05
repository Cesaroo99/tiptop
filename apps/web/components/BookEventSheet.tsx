"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { reservationAmountXaf } from "@tiptop/domain";
import { api, ApiError, type EventCard, type ReservationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/lib/money";
import { sheetOverlayClass, useSheetPortal } from "@/lib/sheet-portal";
import { formatEventDateBadge, formatRelative, splitPostLead } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { BookmarkIcon, SearchIcon } from "./Icons";

export type BookContact = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string | null;
  city?: string | null;
  profession?: string | null;
};

export type InvitePool = {
  friends: BookContact[];
  nearby: BookContact[];
  later: BookContact[];
};

export type BookPreview = {
  eventId: string;
  title: string;
  body: string;
  startsAt: string;
  createdAt?: string;
  minAge?: number | null;
  author: {
    firstName: string;
    lastName: string;
    avatarUrl?: string | null;
    certified?: boolean;
  };
};

type Circle = "friends" | "nearby" | "later";

export function BookEventSheet({
  open,
  onClose,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  preview: BookPreview | null;
}) {
  const { locale, messages } = useI18n();
  const { formatPrice } = useMoney();
  const router = useRouter();
  const portal = useSheetPortal();
  const [event, setEvent] = useState<EventCard | null>(null);
  const [pool, setPool] = useState<InvitePool>({ friends: [], nearby: [], later: [] });
  const [query, setQuery] = useState("");
  const [circle, setCircle] = useState<Circle>("friends");
  const [includeSelf, setIncludeSelf] = useState(true);
  const [picked, setPicked] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadPool(q?: string) {
    try {
      const data = await api<InvitePool>(`/invite-pool${q?.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      setPool({
        friends: data.friends ?? [],
        nearby: data.nearby ?? [],
        later: data.later ?? [],
      });
    } catch {
      setPool({ friends: [], nearby: [], later: [] });
    }
  }

  useEffect(() => {
    if (!open || !preview) return;
    setError(null);
    setIncludeSelf(true);
    setPicked([]);
    setQuery("");
    setCircle("friends");
    api<EventCard>(`/events/${preview.eventId}`)
      .then(setEvent)
      .catch(() => setEvent(null));
    void loadPool();
  }, [open, preview]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => void loadPool(query), query ? 220 : 0);
    return () => window.clearTimeout(t);
  }, [open, query]);

  const hostId = event?.host?.id;
  const laterIds = new Set(pool.later.map((p) => p.id));
  const directory = useMemo(() => {
    const map = new Map<string, BookContact>();
    for (const p of [...pool.friends, ...pool.nearby, ...pool.later]) map.set(p.id, p);
    return map;
  }, [pool]);

  const selectedPeople = picked.map((id) => directory.get(id)).filter(Boolean) as BookContact[];
  const list = (circle === "friends" ? pool.friends : circle === "nearby" ? pool.nearby : pool.later).filter(
    (p) => p.id !== hostId,
  );
  const emptyLabel =
    circle === "friends"
      ? messages.booking.friendsEmpty
      : circle === "nearby"
        ? messages.booking.nearbyEmpty
        : messages.booking.laterEmpty;

  const price = event?.priceXaf ?? 0;
  const eventCurrency = event?.currency ?? "XAF";
  const seats = (includeSelf ? 1 : 0) + picked.length;
  const total = reservationAmountXaf(price, Math.max(1, seats));
  const canSubmit = seats > 0 && !event?.isHost && event?.canBook !== false;
  const { lead, rest } = splitPostLead(preview?.body ?? event?.description ?? "");

  const dateBadge = useMemo(() => {
    const iso = preview?.startsAt ?? event?.startsAt;
    return iso ? formatEventDateBadge(iso, locale) : "";
  }, [preview?.startsAt, event?.startsAt, locale]);

  async function book() {
    if (!preview || !canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api<ReservationItem>("/reservations", {
        method: "POST",
        body: JSON.stringify({
          eventId: preview.eventId,
          includeSelf,
          holderIds: picked,
        }),
      });
      onClose();
      if (res.needsPayment) {
        router.push(`/events/${preview.eventId}/pay?reservationId=${res.id}`);
      } else {
        const ticketId = res.tickets[0]?.id;
        router.push(ticketId ? `/tickets/${ticketId}` : "/tickets");
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "EVENT_FULL") setError(messages.booking.full);
      else if (e instanceof ApiError && e.code === "ALREADY_IN") setError(messages.booking.bookAlready);
      else if (e instanceof ApiError && e.code === "AGE_RESTRICTED") setError(messages.booking.ageRestrictedError);
      else if (e instanceof ApiError && e.code === "NO_HOLDERS") setError(messages.booking.bookPickSomeone);
      else setError(messages.common.error);
    } finally {
      setLoading(false);
    }
  }

  function toggleFriend(id: string) {
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  async function toggleLater(person: BookContact) {
    const saved = laterIds.has(person.id);
    try {
      if (saved) {
        await api(`/invite-later/${person.id}`, { method: "DELETE" });
      } else {
        await api(`/invite-later/${person.id}`, { method: "POST" });
      }
      await loadPool(query);
    } catch {
      setError(messages.common.error);
    }
  }

  if (!open || !preview || !portal) return null;

  const relative = preview.createdAt ? formatRelative(preview.createdAt, messages.social) : null;
  const priceLabel = price > 0 ? formatPrice(price, eventCurrency) : messages.world.free;
  const cta = price > 0 && seats > 0 ? messages.booking.goToPayment : messages.booking.reserve;
  const tabs: { id: Circle; label: string; count: number }[] = [
    { id: "friends", label: messages.booking.inviteCircleFriends, count: pool.friends.filter((p) => p.id !== hostId).length },
    { id: "nearby", label: messages.booking.inviteCircleNearby, count: pool.nearby.filter((p) => p.id !== hostId).length },
    { id: "later", label: messages.booking.inviteCircleLater, count: pool.later.filter((p) => p.id !== hostId).length },
  ];

  return createPortal(
    <div
      className={sheetOverlayClass(portal)}
      role="dialog"
      aria-modal
      aria-label={messages.booking.bookEventTitle}
      onClick={onClose}
    >
      <div
        className="sheet-panel w-full max-w-md rounded-t-[28px] bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <h2 className="type-h3 pt-0.5 text-ink">{messages.booking.bookEventTitle}</h2>
          <span className="shrink-0 rounded-lg bg-accent px-2.5 py-1.5 type-caption font-bold text-on-primary">
            {priceLabel}
          </span>
        </div>

        <div className="relative mt-3 rounded-2xl bg-surface-sunken px-3 py-3">
          {dateBadge ? (
            <span className="absolute right-2.5 top-2.5 rounded-md bg-yellow px-2 py-0.5 type-caption font-bold text-ink">
              {dateBadge}
            </span>
          ) : null}
          <div className="flex items-center gap-2 pr-28">
            <Avatar
              src={preview.author.avatarUrl}
              firstName={preview.author.firstName}
              lastName={preview.author.lastName}
              size="sm"
            />
            <div className="min-w-0">
              <p className="type-body-sm truncate font-bold text-ink">
                {preview.author.firstName} {preview.author.lastName}
                {preview.author.certified ? (
                  <span className="ml-1">
                    <CertifiedMark />
                  </span>
                ) : null}
              </p>
              {relative ? <p className="type-caption text-muted">{relative}</p> : null}
            </div>
          </div>
          <p className="type-body-sm mt-2 text-ink">
            {lead ? (
              <>
                <span className="font-bold">{lead}</span>
                {rest ? ` ${rest}` : null}
              </>
            ) : (
              preview.body || event?.title
            )}
          </p>
        </div>

        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-sunken px-3 py-3">
          <CheckBox checked={includeSelf} />
          <input
            type="checkbox"
            className="sr-only"
            checked={includeSelf}
            onChange={(e) => setIncludeSelf(e.target.checked)}
          />
          <span className="type-body-sm font-medium text-ink">{messages.booking.forMyself}</span>
        </label>

        <p className="type-caption mt-4 font-medium text-muted">{messages.booking.inviteFriends}</p>
        <div className="mt-2 rounded-2xl bg-surface-sunken px-2.5 py-2.5">
          {selectedPeople.length ? (
            <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
              {selectedPeople.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleFriend(c.id)}
                  className="tap-scale flex shrink-0 items-center gap-2 rounded-full bg-accent py-1 pl-1.5 pr-3 text-on-primary"
                >
                  <Avatar src={c.avatarUrl} firstName={c.firstName} lastName={c.lastName} size={22} />
                  <span className="type-caption font-semibold">
                    {c.firstName} {c.lastName}
                  </span>
                </button>
              ))}
            </div>
          ) : null}

          <label className="mb-2 flex items-center gap-2 rounded-xl bg-surface px-2.5 py-2">
            <SearchIcon size={14} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={messages.booking.inviteSearch}
              className="w-full bg-transparent type-caption text-ink outline-none placeholder:text-muted"
            />
          </label>

          <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl bg-surface p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCircle(tab.id)}
                className={`rounded-lg py-1.5 type-caption font-semibold transition ${
                  circle === tab.id ? "bg-accent text-on-primary" : "text-muted"
                }`}
              >
                {tab.label}
                {tab.count ? ` · ${tab.count}` : ""}
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <p className="type-caption px-1 py-2 text-muted">{emptyLabel}</p>
          ) : (
            <ul className="no-scrollbar max-h-48 space-y-1 overflow-y-auto">
              {list.map((c) => {
                const on = picked.includes(c.id);
                const saved = laterIds.has(c.id);
                return (
                  <li key={c.id} className="flex items-center gap-2 rounded-xl bg-surface px-2 py-1.5">
                    <button type="button" onClick={() => toggleFriend(c.id)} className="flex min-w-0 flex-1 items-center gap-2">
                      <CheckBox checked={on} />
                      <Avatar src={c.avatarUrl} firstName={c.firstName} lastName={c.lastName} size={28} />
                      <span className="min-w-0 text-left">
                        <span className="type-caption block truncate font-semibold text-ink">
                          {c.firstName} {c.lastName}
                        </span>
                        <span className="type-caption block truncate text-muted">@{c.username}</span>
                      </span>
                    </button>
                    {circle !== "friends" ? (
                      <button
                        type="button"
                        aria-label={saved ? messages.booking.removeFromLater : messages.booking.saveForLater}
                        onClick={() => void toggleLater(c)}
                        className={`grid h-8 w-8 place-items-center rounded-full ${
                          saved ? "bg-yellow text-ink" : "bg-surface-sunken text-muted"
                        }`}
                      >
                        <BookmarkIcon size={14} filled={saved} />
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {event?.minAge ? (
          <p className="type-caption mt-3 rounded-xl bg-danger-soft px-3 py-2 font-semibold text-danger">
            {messages.booking.ageRestrictedNotice.replace("{age}", String(event.minAge))}
          </p>
        ) : null}
        {event?.isHost ? <p className="type-caption mt-3 text-muted">{messages.booking.bookHost}</p> : null}
        {event && !event.isHost && event.canBook === false ? (
          <p className="type-caption mt-3 text-muted">
            {messages.booking.bookAlready}{" "}
            {event.viewerTicketId ? (
              <Link href={`/tickets/${event.viewerTicketId}`} className="font-semibold text-accent">
                {messages.booking.seeTicket}
              </Link>
            ) : null}
          </p>
        ) : null}
        {error ? <p className="type-caption mt-3 font-semibold text-danger">{error}</p> : null}
        {price > 0 && seats > 1 ? (
          <p className="type-caption mt-3 font-semibold text-ink">
            {messages.booking.bookTotal.replace("{amount}", formatPrice(total, eventCurrency))}
          </p>
        ) : null}

        {event?.isHost ? (
          <Link
            href={`/events/${preview.eventId}/manage`}
            onClick={onClose}
            className="tap-scale mt-4 flex w-full items-center justify-center rounded-2xl bg-accent py-3.5 type-button text-on-primary"
          >
            {messages.booking.manageEvent}
          </Link>
        ) : (
          <button
            type="button"
            disabled={!canSubmit || loading}
            onClick={() => void book()}
            className="tap-scale mt-4 w-full rounded-2xl bg-accent py-3.5 type-button text-on-primary shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? messages.common.loading : cta}
          </button>
        )}
      </div>
    </div>,
    portal,
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-5 w-5 shrink-0 place-items-center rounded-[5px] border ${
        checked ? "border-accent bg-accent text-white" : "border-[#c8ccd4] bg-white"
      }`}
    >
      {checked ? (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2.4 6.2 4.7 8.5 9.6 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </span>
  );
}
