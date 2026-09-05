"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  allowedBookingIntents,
  planEventBooking,
  reservationAmountXaf,
  seatsClaimedNow,
  type BookingIntent,
} from "@tiptop/domain";
import { api, ApiError, type EventCard, type ReservationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/lib/money";
import { sheetOverlayClass, useSheetPortal } from "@/lib/sheet-portal";
import { formatEventDateBadge, formatRelative, splitPostLead } from "@/lib/time";
import { Avatar, CertifiedMark } from "./Avatar";
import { BookmarkIcon, ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "./Icons";
import { SeatsLeftBadge, seatsRemainingOf } from "./SeatsLeftBadge";

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
type Step = "browse" | "confirm";

const SWIPE_THRESHOLD = 80;

export function BookEventSheet({
  open,
  onClose,
  onBooked,
  preview,
}: {
  open: boolean;
  onClose: () => void;
  onBooked?: (seats: number) => void;
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
  const [browseMode, setBrowseMode] = useState<"list" | "cards">("cards");
  const [cardIndex, setCardIndex] = useState(0);
  const [step, setStep] = useState<Step>("browse");
  const [intent, setIntent] = useState<BookingIntent>("PAY_NOW");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; id: number } | null>(null);

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
    setBrowseMode("cards");
    setCardIndex(0);
    setStep("browse");
    setIntent("PAY_NOW");
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

  useEffect(() => {
    setCardIndex(0);
  }, [circle, query, browseMode]);

  const card = list[Math.min(cardIndex, Math.max(0, list.length - 1))] ?? null;
  const emptyLabel =
    circle === "friends"
      ? messages.booking.friendsEmpty
      : circle === "nearby"
        ? messages.booking.nearbyEmpty
        : messages.booking.laterEmpty;

  const price = event?.priceXaf ?? 0;
  const eventCurrency = event?.currency ?? "XAF";
  const paymentRule = event?.paymentRule ?? "HOLD";
  const allowedIntents = useMemo(
    () => allowedBookingIntents({ price, paymentRule }),
    [price, paymentRule],
  );
  const plan = planEventBooking({
    price,
    paymentRule,
    includeSelf,
    pickedCount: picked.length,
    intent,
  });
  const seatsNow = (includeSelf && plan.bookSelfNow ? 1 : 0) + (plan.includeGuestsInReservation ? picked.length : 0);
  const claimed = seatsClaimedNow(plan, includeSelf, picked.length);
  const remaining = seatsRemainingOf(event?.capacity, event?.reservedCount ?? event?.taken, event?.remaining);
  const leftover = remaining == null ? null : remaining - claimed;
  const eventFull = remaining != null && remaining <= 0;
  const overCapacity = leftover != null && leftover < 0;
  const total = reservationAmountXaf(price, Math.max(0, seatsNow));
  const canSubmit =
    (includeSelf || picked.length > 0) &&
    !event?.isHost &&
    event?.canBook !== false &&
    !eventFull &&
    !overCapacity;
  const { lead, rest } = splitPostLead(preview?.body ?? event?.description ?? "");

  useEffect(() => {
    if (!allowedIntents.includes(intent)) setIntent(allowedIntents[0] ?? "PAY_NOW");
  }, [allowedIntents, intent]);

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
          intent,
        }),
      });
      onClose();
      onBooked?.(claimed);
      if (res.needsPayment && res.id) {
        router.push(`/events/${preview.eventId}/pay?reservationId=${res.id}`);
      } else if (res.invitations?.length) {
        router.push("/tickets?tab=invites");
      } else {
        const ticketId = res.tickets[0]?.id;
        router.push(ticketId ? `/tickets/${ticketId}` : "/tickets");
      }
    } catch (e) {
      if (e instanceof ApiError && e.code === "EVENT_FULL") setError(messages.booking.full);
      else if (e instanceof ApiError && e.code === "ALREADY_IN") setError(messages.booking.bookAlready);
      else if (e instanceof ApiError && e.code === "AGE_RESTRICTED") setError(messages.booking.ageRestrictedError);
      else if (e instanceof ApiError && e.code === "NO_HOLDERS") setError(messages.booking.bookPickSomeone);
      else if (e instanceof ApiError && e.code === "WAIT_NOT_ALLOWED") setError(messages.booking.waitNotAllowed);
      else setError(messages.common.error);
    } finally {
      setLoading(false);
    }
  }

  function toggleFriend(id: string) {
    setPicked((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id);
      const nextPlan = planEventBooking({
        price,
        paymentRule,
        includeSelf,
        pickedCount: cur.length + 1,
        intent,
      });
      const nextClaimed = seatsClaimedNow(nextPlan, includeSelf, cur.length + 1);
      if (remaining != null && nextClaimed > remaining) {
        setError(messages.booking.full);
        return cur;
      }
      setError(null);
      return [...cur, id];
    });
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

  function goNextCard() {
    setCardIndex((i) => Math.min(list.length - 1, i + 1));
  }
  function goPrevCard() {
    setCardIndex((i) => Math.max(0, i - 1));
  }

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    dragStart.current = { x: e.clientX, id: e.pointerId };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!dragStart.current || dragStart.current.id !== e.pointerId) return;
    setDragX(e.clientX - dragStart.current.x);
  }
  function onPointerEnd(e: React.PointerEvent<HTMLElement>) {
    if (!dragStart.current || dragStart.current.id !== e.pointerId) return;
    const dx = e.clientX - dragStart.current.x;
    dragStart.current = null;
    setDragging(false);
    if (dx <= -SWIPE_THRESHOLD && cardIndex < list.length - 1) goNextCard();
    else if (dx >= SWIPE_THRESHOLD && cardIndex > 0) goPrevCard();
    setDragX(0);
  }

  if (!open || !preview || !portal) return null;

  const relative = preview.createdAt ? formatRelative(preview.createdAt, messages.social) : null;
  const priceLabel = price > 0 ? formatPrice(price, eventCurrency) : messages.world.free;
  const cta =
    picked.length > 0 && intent === "WAIT_ACCEPT"
      ? messages.booking.waitAcceptCta
      : picked.length > 0 && intent === "GUEST_PAYS"
        ? messages.booking.guestPaysCta
        : price > 0 && seatsNow > 0
          ? messages.booking.goToPayment
          : messages.booking.reserve;
  const tabs: { id: Circle; label: string; count: number }[] = [
    { id: "friends", label: messages.booking.inviteCircleFriends, count: pool.friends.filter((p) => p.id !== hostId).length },
    { id: "nearby", label: messages.booking.inviteCircleNearby, count: pool.nearby.filter((p) => p.id !== hostId).length },
    { id: "later", label: messages.booking.inviteCircleLater, count: pool.later.filter((p) => p.id !== hostId).length },
  ];

  const intentOptions = (
    price > 0
      ? ([
          ["PAY_NOW", messages.booking.intentPayNow, messages.booking.intentPayNowHint],
          ["WAIT_ACCEPT", messages.booking.intentWaitAccept, messages.booking.intentWaitAcceptHint],
          ["GUEST_PAYS", messages.booking.intentGuestPays, messages.booking.intentGuestPaysHint],
        ] as const)
      : ([
          ["PAY_NOW", messages.booking.intentPayNow, messages.booking.intentPayNowHint],
          ["WAIT_ACCEPT", messages.booking.intentWaitAccept, messages.booking.intentWaitAcceptHint],
        ] as const)
  ).filter(([id]) => allowedIntents.includes(id));

  const browseCta = picked.length > 0 ? messages.booking.continueConfirm : cta;

  return createPortal(
    <div
      className={sheetOverlayClass(portal)}
      role="dialog"
      aria-modal
      aria-label={messages.booking.bookEventTitle}
      onClick={onClose}
    >
      <div
        className="sheet-panel max-h-[min(92dvh,760px)] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {step === "confirm" ? (
              <button
                type="button"
                onClick={() => setStep("browse")}
                className="type-caption mb-1 font-semibold text-accent"
              >
                ← {messages.booking.backToPeople}
              </button>
            ) : null}
            <h2 className="type-h3 pt-0.5 text-ink">{messages.booking.bookEventTitle}</h2>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="rounded-lg bg-accent px-2.5 py-1.5 type-caption font-bold text-on-primary">
              {priceLabel}
            </span>
            <SeatsLeftBadge remaining={remaining} />
          </div>
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

        {step === "browse" ? (
          <>
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

            <div className="mt-4 flex items-center justify-between gap-2">
              <p className="type-caption font-medium text-muted">{messages.booking.inviteFriends}</p>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-sunken p-0.5">
                {(["cards", "list"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setBrowseMode(mode)}
                    className={`rounded-md px-2 py-1 type-caption font-semibold ${
                      browseMode === mode ? "bg-accent text-on-primary" : "text-muted"
                    }`}
                  >
                    {mode === "list" ? messages.booking.browseList : messages.booking.browseCards}
                  </button>
                ))}
              </div>
            </div>
            <p className="type-caption mt-1 text-muted">{messages.booking.browseHint}</p>
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
              ) : browseMode === "cards" && card ? (
                <div className="space-y-2">
                  <article
                    className="overflow-hidden rounded-2xl bg-surface"
                    style={{
                      transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
                      transition: dragging ? "none" : "transform 220ms var(--ease-standard)",
                    }}
                  >
                    <div
                      className="relative h-52 touch-pan-y select-none bg-gradient-to-br from-accent/15 to-yellow/15"
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerEnd}
                      onPointerCancel={onPointerEnd}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      {card.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={card.avatarUrl} alt="" draggable={false} className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center type-h1 text-accent">{card.firstName[0]}</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8">
                        <p className="type-body-sm font-bold text-white">
                          {card.firstName} {card.lastName}
                        </p>
                        <p className="type-caption text-white/80">
                          @{card.username}
                          {card.profession ? ` · ${card.profession}` : ""}
                          {card.city ? ` · ${card.city}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-2.5">
                      <button
                        type="button"
                        onClick={() => toggleFriend(card.id)}
                        className={`tap-scale rounded-xl py-2 type-caption font-bold ${
                          picked.includes(card.id) ? "bg-accent text-on-primary" : "bg-surface-sunken text-ink"
                        }`}
                      >
                        {picked.includes(card.id) ? messages.booking.pickedForSeat : messages.booking.pickForSeat}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (circle !== "friends") void toggleLater(card);
                          goNextCard();
                        }}
                        className="tap-scale rounded-xl bg-surface-sunken py-2 type-caption font-semibold text-ink"
                      >
                        {circle === "friends" ? messages.booking.skipProfile : messages.booking.saveForLater}
                      </button>
                    </div>
                  </article>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={cardIndex <= 0}
                      onClick={goPrevCard}
                      className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink disabled:opacity-30"
                      aria-label={messages.booking.nextProfile}
                    >
                      <ChevronLeftIcon size={16} />
                    </button>
                    <span className="type-caption text-muted">
                      {Math.min(cardIndex + 1, list.length)} / {list.length}
                    </span>
                    <button
                      type="button"
                      disabled={cardIndex >= list.length - 1}
                      onClick={goNextCard}
                      className="grid h-9 w-9 place-items-center rounded-full bg-accent text-on-primary disabled:opacity-30"
                      aria-label={messages.booking.nextProfile}
                    >
                      <ChevronRightIcon size={16} />
                    </button>
                  </div>
                </div>
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
          </>
        ) : (
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-sunken px-3 py-3">
              <CheckBox checked={includeSelf} />
              <input
                type="checkbox"
                className="sr-only"
                checked={includeSelf}
                onChange={(e) => setIncludeSelf(e.target.checked)}
              />
              <span className="type-body-sm font-medium text-ink">{messages.booking.forMyself}</span>
            </label>
            {selectedPeople.length ? (
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
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
            {intentOptions.map(([id, label, hint]) => (
              <label key={id} className="flex cursor-pointer items-start gap-2.5 rounded-2xl bg-surface-sunken px-3 py-2.5">
                <input
                  type="radio"
                  className="mt-1"
                  name="book-intent"
                  checked={intent === id}
                  onChange={() => setIntent(id)}
                />
                <span>
                  <span className="type-caption block font-semibold text-ink">{label}</span>
                  <span className="type-caption text-muted">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {step === "confirm" && plan.holdOnInvite && price > 0 ? (
          <p className="type-caption mt-3 rounded-xl bg-yellow/40 px-3 py-2 font-semibold text-ink">
            {messages.booking.holdWaitNotice}
          </p>
        ) : null}
        {step === "confirm" && paymentRule === "PAY_FIRST" && price > 0 && intent === "WAIT_ACCEPT" ? (
          <p className="type-caption mt-3 rounded-xl bg-accent-soft px-3 py-2 font-semibold text-accent">
            {messages.booking.waitNoHoldNotice}
          </p>
        ) : null}
        {paymentRule === "PAY_REQUIRED" && price > 0 ? (
          <p className="type-caption mt-3 rounded-xl bg-accent-soft px-3 py-2 font-semibold text-accent">
            {messages.booking.payRequiredNotice}
          </p>
        ) : paymentRule === "PAY_FIRST" && price > 0 && (step === "browse" || intent !== "WAIT_ACCEPT") ? (
          <p className="type-caption mt-3 rounded-xl bg-accent-soft px-3 py-2 font-semibold text-accent">
            {messages.booking.payFirstNotice}
          </p>
        ) : null}

        {event?.minAge ? (
          <p className="type-caption mt-3 rounded-xl bg-danger-soft px-3 py-2 font-semibold text-danger">
            {messages.booking.ageRestrictedNotice.replace("{age}", String(event.minAge))}
          </p>
        ) : null}
        {event?.isHost ? <p className="type-caption mt-3 text-muted">{messages.booking.bookHost}</p> : null}
        {eventFull ? (
          <p className="type-caption mt-3 rounded-xl bg-danger-soft px-3 py-2 font-semibold text-danger">
            {messages.booking.full}
          </p>
        ) : leftover != null && leftover >= 0 && claimed > 0 ? (
          <p className="type-caption mt-3 font-semibold text-ink">
            {messages.booking.seatsPicking.replace("{count}", String(leftover))}
          </p>
        ) : null}
        {event && !event.isHost && event.canBook === false && !eventFull ? (
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
        {(step === "confirm" || picked.length === 0) && price > 0 && seatsNow > 1 ? (
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
            onClick={() => {
              if (step === "browse" && picked.length > 0) {
                setStep("confirm");
                return;
              }
              void book();
            }}
            className="tap-scale mt-4 w-full rounded-2xl bg-accent py-3.5 type-button text-on-primary shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            {loading ? messages.common.loading : step === "browse" && picked.length > 0 ? browseCta : cta}
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
