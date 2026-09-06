"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { presenceFromDeclared, type PresenceState } from "@tiptop/domain";
import { AppShell } from "@/components/AppShell";
import { AvailabilityBadge, PresenceDot } from "@/components/AvailabilityBadge";
import { BriefcaseIcon, ChevronLeftIcon, ChevronRightIcon, HeartIcon, RouteIcon } from "@/components/Icons";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { Chip, EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { api, ApiError, type PersonCard } from "@/lib/api";
import { useViewerGeo } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { viewerLikeActive } from "@/lib/like-feed";
import { useLikePlacement } from "@/lib/like-placement";
import { useSession } from "@/lib/session";
import { CertifiedMark } from "@/components/Avatar";

type Circle = "FRIEND" | "NEARBY" | "LATER";

export default function Page() {
  return (
    <AppShell>
      <PeopleCarousel />
    </AppShell>
  );
}

function PeopleCarousel() {
  const { messages } = useI18n();
  const { user, refresh } = useSession();
  const { placement, ready, refresh: refreshPlacement } = useLikePlacement();
  const { coords, status: geoStatus, retry: retryGeo } = useViewerGeo();
  const [items, setItems] = useState<PersonCard[] | null>(null);
  const [circle, setCircle] = useState<Circle>("NEARBY");
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [maxKm, setMaxKm] = useState("");
  const [profession, setProfession] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; id: number } | null>(null);
  const SWIPE_THRESHOLD = 90;

  async function load() {
    try {
      const params = new URLSearchParams();
      params.set("city", user?.city ?? "Yaoundé");
      if (user?.zone) params.set("zone", user.zone);
      if (availableOnly) params.set("available", "1");
      if (maxKm) params.set("maxKm", maxKm);
      if (profession.trim()) params.set("profession", profession.trim());
      if (coords) {
        params.set("lat", String(coords.latitude));
        params.set("lng", String(coords.longitude));
      }
      const data = await api<{ items: PersonCard[] }>(`/discovery/people?${params.toString()}`);
      setItems(data.items);
      setIndex(0);
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.city, user?.zone, availableOnly, coords?.latitude, coords?.longitude]);

  const filtered = useMemo(() => {
    if (!items) return null;
    return items.filter((p) => (p.circle ?? "NEARBY") === circle);
  }, [items, circle]);

  async function setMyPresence(availability: "AVAILABLE" | "BUSY" | "HIDDEN") {
    setBusy(true);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ availability, ttlHours: 4 }),
      });
      await refresh();
    } catch {
      setError(messages.common.error);
    } finally {
      setBusy(false);
    }
  }

  function setCircleTab(next: Circle) {
    setCircle(next);
    setIndex(0);
  }

  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (!items || !filtered) return <Skeleton className="mx-4 mt-6 h-96" />;

  const person = filtered[index];
  const title =
    circle === "FRIEND" ? messages.world.peopleFriends : circle === "LATER" ? messages.world.peopleLater : messages.world.peopleNearby;
  const empty =
    circle === "FRIEND"
      ? messages.world.peopleFriendsEmpty
      : circle === "LATER"
        ? messages.world.peopleLaterEmpty
        : messages.world.peopleAroundEmpty;

  const counts = {
    FRIEND: items.filter((p) => p.circle === "FRIEND").length,
    NEARBY: items.filter((p) => (p.circle ?? "NEARBY") === "NEARBY").length,
    LATER: items.filter((p) => p.circle === "LATER").length,
  };

  if (!person) {
    return (
      <div className="px-4 py-3">
        <PeopleChrome
          title={title}
          circle={circle}
          counts={counts}
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          onCircle={setCircleTab}
          mine={presenceFromDeclared(user?.availability)}
          busy={busy}
          onPresence={(k) => void setMyPresence(k)}
        />
        <EmptyState title={title} body={empty} />
      </div>
    );
  }

  const prev = filtered[index - 1];
  const next = filtered[index + 1];
  const presence = (person.presence ?? presenceFromDeclared(person.availability)) as PresenceState;
  const mine = presenceFromDeclared(user?.availability);
  const count = filtered.length;
  const liked = viewerLikeActive(placement, "user", person.id, Boolean(person.likedByMe), ready);

  function goNext() {
    setIndex((i) => Math.min(count - 1, i + 1));
  }
  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    e.preventDefault();
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
    if (dx <= -SWIPE_THRESHOLD && index < count - 1) goNext();
    else if (dx >= SWIPE_THRESHOLD && index > 0) goPrev();
    setDragX(0);
  }

  const distanceText =
    person.distanceLabel ??
    (person.distanceKm != null ? messages.world.distance.replace("{km}", String(person.distanceKm)) : null);

  const circleLabel =
    person.circle === "FRIEND"
      ? messages.world.circleFriend
      : person.circle === "LATER"
        ? messages.world.circleLater
        : messages.world.circleAround;

  async function likePerson(confirmTransfer = false) {
    setBusy(true);
    try {
      if (liked) {
        await api(`/users/${person.id}/like`, { method: "DELETE" });
        setItems((cur) => cur?.map((p) => (p.id === person.id ? { ...p, likedByMe: false } : p)) ?? cur);
        await refreshPlacement();
        return;
      }
      await api(`/users/${person.id}/like`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      setItems((cur) => cur?.map((p) => ({ ...p, likedByMe: p.id === person.id })) ?? cur);
      await refreshPlacement();
      setTransfer(null);
      setBuy(false);
    } catch (e) {
      if (e instanceof ApiError) {
        const kind = likeErrorKind(String(e.code));
        if (kind === "buy") {
          setBuy(true);
          return;
        }
        if (kind === "transfer") setTransfer(`${person.firstName} ${person.lastName}`);
      } else {
        setError(messages.common.error);
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleLater() {
    setBusy(true);
    try {
      const saved = person.circle === "LATER";
      await api(`/invite-later/${person.id}`, { method: saved ? "DELETE" : "POST" });
      setItems((cur) => {
        if (!cur) return cur;
        return cur.map((p) => {
          if (p.id !== person.id) return p;
          return { ...p, circle: saved ? "NEARBY" : "LATER" };
        });
      });
      if (saved && circle === "LATER") setIndex(0);
    } catch {
      setError(messages.common.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-4 py-3">
      <PeopleChrome
        title={title}
        circle={circle}
        counts={counts}
        filtersOpen={filtersOpen}
        setFiltersOpen={setFiltersOpen}
        onCircle={setCircleTab}
        mine={mine}
        busy={busy}
        onPresence={(k) => void setMyPresence(k)}
      />

      {filtersOpen ? (
        <form
          className="mb-4 space-y-3 rounded-card bg-surface p-4 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <label className="type-body-sm flex items-center gap-2 text-ink">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} />
            {messages.world.onlyAvailable}
          </label>
          <input
            value={maxKm}
            onChange={(e) => setMaxKm(e.target.value)}
            placeholder={messages.world.maxDistance}
            className="h-11 w-full rounded-full bg-surface-sunken px-4 type-body-sm text-ink outline-none"
          />
          <input
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder={messages.world.professionFilter}
            className="h-11 w-full rounded-full bg-surface-sunken px-4 type-body-sm text-ink outline-none"
          />
          <button type="submit" className="type-button tap-scale h-10 w-full rounded-full bg-accent text-on-primary">
            {messages.common.apply}
          </button>
        </form>
      ) : null}

      <div className="relative mx-auto max-w-sm">
        {prev?.avatarUrl ? (
          <div className="pointer-events-none absolute -left-8 top-10 h-48 w-12 overflow-hidden rounded-[22px] opacity-30 blur-[1px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={prev.avatarUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        {next?.avatarUrl ? (
          <div className="pointer-events-none absolute -right-8 top-10 h-48 w-12 overflow-hidden rounded-[22px] opacity-30 blur-[1px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={next.avatarUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <article
          className="fade-in touch-pan-y select-none overflow-hidden rounded-[26px] bg-surface shadow-elevated"
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
            transition: dragging ? "none" : "transform 220ms var(--ease-standard)",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onDragStart={(e) => e.preventDefault()}
        >
          <Link href={`/u/${person.username}`} className="relative block h-52 bg-gradient-to-br from-accent/15 to-yellow/15">
            {person.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.avatarUrl} alt="" draggable={false} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center type-display text-accent">{person.firstName[0]}</div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-10">
              <AvailabilityBadge presence={presence} compact />
              <span className="type-caption rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white">{circleLabel}</span>
            </div>
          </Link>
          <div className="space-y-2.5 px-4 pb-4 pt-3">
            <div className="flex items-start gap-3">
              <h2 className="min-w-0 flex-1">
                <span className="type-h2 line-clamp-2 break-words text-ink">
                  {person.firstName} {person.lastName}
                  {person.certified ? (
                    <span className="ml-1 inline-block align-middle">
                      <CertifiedMark />
                    </span>
                  ) : null}
                </span>
                <span className="type-caption mt-1 flex min-w-0 items-center gap-1.5 text-muted">
                  {person.age != null ? <span className="shrink-0">{messages.world.age.replace("{age}", String(person.age))}</span> : null}
                  {person.age != null && person.profession ? <span aria-hidden>·</span> : null}
                  {person.profession ? (
                    <span className="inline-flex min-w-0 items-center gap-1 truncate">
                      <BriefcaseIcon size={13} />
                      <span className="truncate">{person.profession}</span>
                    </span>
                  ) : null}
                </span>
              </h2>
              <button
                type="button"
                disabled={busy}
                aria-label={liked ? messages.social.likeHere : messages.social.likePlace}
                onClick={() => void likePerson(false)}
                className={`tap-scale grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                  liked ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
                }`}
              >
                <HeartIcon size={17} filled={liked} />
              </button>
            </div>
            <p className="type-caption inline-flex max-w-full items-center gap-1.5 text-muted">
              <RouteIcon size={13} />
              <span className="truncate">
                {distanceText ?? (geoStatus === "idle" ? messages.world.locating : messages.world.approximate)}
              </span>
            </p>
            {geoStatus === "denied" || geoStatus === "unsupported" ? (
              <button type="button" onClick={retryGeo} className="type-caption font-semibold text-accent">
                {messages.world.retryGeo}
              </button>
            ) : null}
            {person.activeMood ? (
              <p className="type-caption truncate rounded-lg bg-accent-soft px-3 py-1.5 font-medium text-accent">
                {person.activeMood.activity || person.activeMood.body}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              {presence === "AVAILABLE" ? (
                <button
                  type="button"
                  onClick={() => setInviteOpen(true)}
                  className="tap-scale type-caption h-9 truncate rounded-full bg-accent px-3 font-semibold text-on-primary shadow-xs"
                >
                  {messages.world.inviteNamed.replace("{name}", person.firstName)}
                </button>
              ) : (
                <span className="type-caption grid h-9 place-items-center rounded-full bg-surface-sunken font-semibold text-muted">
                  {messages.world.unavailable}
                </span>
              )}
              <Link
                href={`/u/${person.username}`}
                className="tap-scale type-caption grid h-9 place-items-center rounded-full bg-surface-sunken px-3 font-semibold text-ink"
              >
                {messages.world.seeProfile}
              </Link>
            </div>
            {person.circle !== "FRIEND" ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void toggleLater()}
                className="type-caption w-full py-0.5 text-center font-medium text-muted"
              >
                {person.circle === "LATER" ? messages.world.savedForLater : messages.world.saveForLater}
              </button>
            ) : null}
          </div>
        </article>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={messages.world.previousPerson}
          className="tap-scale grid h-11 w-11 place-items-center rounded-full bg-surface-sunken text-ink shadow-xs disabled:opacity-30"
          disabled={index === 0}
          onClick={goPrev}
        >
          <ChevronLeftIcon size={18} />
        </button>
        <button
          type="button"
          className="type-caption tap-scale rounded-full bg-surface-sunken px-5 py-2.5 font-semibold text-ink shadow-xs"
          onClick={goNext}
        >
          {messages.world.passPerson}
        </button>
        <button
          type="button"
          aria-label={messages.world.nextPerson}
          className="tap-scale grid h-11 w-11 place-items-center rounded-full bg-accent text-on-primary shadow-sm"
          onClick={goNext}
        >
          <ChevronRightIcon size={18} />
        </button>
      </div>
      <SocialInviteModal
        open={inviteOpen}
        inviteeId={person.id}
        defaultContext="MEETUP"
        defaultLabel={person.activeMood?.activity ?? ""}
        onClose={() => setInviteOpen(false)}
      />
      <LikeDialogs
        transferName={transfer}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void likePerson(true)}
        onCloseBuy={() => setBuy(false)}
      />
    </div>
  );
}

function PeopleChrome({
  title,
  circle,
  counts,
  filtersOpen,
  setFiltersOpen,
  onCircle,
  mine,
  busy,
  onPresence,
}: {
  title: string;
  circle: Circle;
  counts: Record<Circle, number>;
  filtersOpen: boolean;
  setFiltersOpen: (fn: (v: boolean) => boolean) => void;
  onCircle: (c: Circle) => void;
  mine: PresenceState;
  busy: boolean;
  onPresence: (k: "AVAILABLE" | "BUSY" | "HIDDEN") => void;
}) {
  const { messages } = useI18n();
  const tabs: Array<[Circle, string]> = [
    ["FRIEND", messages.world.peopleFriends],
    ["NEARBY", messages.world.peopleAround],
    ["LATER", messages.world.peopleLater],
  ];
  return (
    <>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h1 className="type-h1 text-accent">{title}</h1>
        <Chip active={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
          {messages.world.filters}
        </Chip>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-1 rounded-full bg-surface-sunken p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onCircle(key)}
            className={`type-caption h-8 truncate rounded-full font-semibold ${
              circle === key ? "bg-surface text-ink shadow-xs" : "text-muted"
            }`}
          >
            {label}
            {counts[key] ? ` ${counts[key]}` : ""}
          </button>
        ))}
      </div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="type-caption font-semibold text-muted">{messages.world.myStatus}</p>
        <div className="flex gap-1.5">
          {(
            [
              ["AVAILABLE", messages.world.available],
              ["BUSY", messages.world.unsure],
              ["HIDDEN", messages.world.unavailable],
            ] as const
          ).map(([key, label]) => {
            const active = mine === presenceFromDeclared(key);
            return (
              <button
                key={key}
                type="button"
                disabled={busy}
                aria-pressed={active}
                onClick={() => onPresence(key)}
                className={`type-caption inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
                  active ? "bg-surface text-ink shadow-xs" : "text-muted"
                }`}
              >
                <PresenceDot presence={key} />
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
