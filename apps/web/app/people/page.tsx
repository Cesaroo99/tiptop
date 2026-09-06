"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { presenceFromDeclared, type PresenceState } from "@tiptop/domain";
import { AppShell } from "@/components/AppShell";
import { AvailabilityBadge, PresenceDot } from "@/components/AvailabilityBadge";
import { BriefcaseIcon, ChevronLeftIcon, ChevronRightIcon, RouteIcon } from "@/components/Icons";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { Chip, EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { api, type PersonCard } from "@/lib/api";
import { useViewerGeo } from "@/lib/geo";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { CertifiedMark } from "@/components/Avatar";

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
  const { coords, status: geoStatus, retry: retryGeo } = useViewerGeo();
  const [items, setItems] = useState<PersonCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [maxKm, setMaxKm] = useState("");
  const [profession, setProfession] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [laterIds, setLaterIds] = useState<Set<string>>(new Set());
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
      const [data, later] = await Promise.all([
        api<{ items: PersonCard[] }>(`/discovery/people?${params.toString()}`),
        api<{ items: Array<{ id: string }> }>("/invite-later").catch(() => ({ items: [] as Array<{ id: string }> })),
      ]);
      setItems(data.items);
      setLaterIds(new Set(later.items.map((p) => p.id)));
      setIndex(0);
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.city, user?.zone, availableOnly, coords?.latitude, coords?.longitude]);

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

  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (!items) return <Skeleton className="mx-4 mt-6 h-96" />;
  const person = items[index];
  if (!person) {
    return (
      <EmptyState
        title={messages.world.peopleEmpty}
        body={messages.world.peopleEmptyBody}
        action={
          <Link href="/" className="font-semibold text-accent">
            {messages.world.goAvailable}
          </Link>
        }
      />
    );
  }

  const prev = items[index - 1];
  const next = items[index + 1];
  const presence = (person.presence ?? presenceFromDeclared(person.availability)) as PresenceState;
  const mine = presenceFromDeclared(user?.availability);
  const count = items.length;

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

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h1 className="type-h1 text-accent">{messages.world.peopleNearby}</h1>
        <Chip active={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
          {messages.world.filters}
        </Chip>
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
                onClick={() => void setMyPresence(key)}
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
        {prev ? (
          <div className="pointer-events-none absolute -left-8 top-10 h-52 w-12 overflow-hidden rounded-[22px] opacity-30 blur-[1px]">
            {prev.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prev.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        ) : null}
        {next ? (
          <div className="pointer-events-none absolute -right-8 top-10 h-52 w-12 overflow-hidden rounded-[22px] opacity-30 blur-[1px]">
            {next.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={next.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
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
          {dragX <= -40 ? (
            <span className="type-label absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-pill bg-ink/70 px-3 py-1.5 text-white">
              {messages.world.passPerson}
            </span>
          ) : dragX >= 40 && prev ? (
            <span className="type-label absolute left-1/2 top-6 z-10 -translate-x-1/2 rounded-pill bg-accent/80 px-3 py-1.5 text-white">
              {messages.world.previousPerson}
            </span>
          ) : null}
          <Link href={`/u/${person.username}`} className="relative block h-56 bg-gradient-to-br from-accent/15 to-yellow/15">
            {person.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.avatarUrl} alt="" draggable={false} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center type-display text-accent">{person.firstName[0]}</div>
            )}
            <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-black/35 ring-2 ring-white/80">
              <PresenceDot presence={presence} />
            </span>
          </Link>
          <div className="space-y-2.5 px-4 pb-4 pt-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="min-w-0">
                <span className="type-h2 block truncate text-ink">
                  {person.firstName} {person.lastName}
                </span>
                <span className="type-caption mt-0.5 flex items-center gap-1.5 text-muted">
                  {person.age != null ? <span>{messages.world.age.replace("{age}", String(person.age))}</span> : null}
                  {person.certified ? <CertifiedMark /> : null}
                </span>
              </h2>
              <AvailabilityBadge presence={presence} compact />
            </div>
            <div className="space-y-1">
              {person.profession ? (
                <p className="type-body-sm grid grid-cols-[16px_1fr] items-center gap-2.5 text-muted">
                  <BriefcaseIcon size={15} />
                  <span>{person.profession}</span>
                </p>
              ) : null}
              <p className="type-body-sm grid grid-cols-[16px_1fr] items-center gap-2.5 text-muted">
                <RouteIcon size={15} />
                <span>
                  {distanceText ?? (geoStatus === "idle" ? messages.world.locating : messages.world.approximate)}
                </span>
              </p>
            </div>
            {geoStatus === "denied" || geoStatus === "unsupported" ? (
              <button type="button" onClick={retryGeo} className="type-caption font-semibold text-accent">
                {messages.world.retryGeo}
              </button>
            ) : null}
            {person.activeMood ? (
              <p className="type-caption rounded-lg bg-accent-soft px-3 py-1.5 font-medium text-accent">
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
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  const saved = laterIds.has(person.id);
                  await api(`/invite-later/${person.id}`, { method: saved ? "DELETE" : "POST" });
                  setLaterIds((cur) => {
                    const nextSet = new Set(cur);
                    if (saved) nextSet.delete(person.id);
                    else nextSet.add(person.id);
                    return nextSet;
                  });
                } catch {
                  setError(messages.common.error);
                } finally {
                  setBusy(false);
                }
              }}
              className="type-caption w-full py-1 text-center font-medium text-muted"
            >
              {laterIds.has(person.id) ? messages.world.savedForLater : messages.world.saveForLater}
            </button>
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
    </div>
  );
}
