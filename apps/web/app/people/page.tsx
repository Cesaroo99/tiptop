"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { BriefcaseIcon, ChevronLeftIcon, ChevronRightIcon, MessageIcon, PinIcon } from "@/components/Icons";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { Chip, EmptyState, ErrorBanner, PrimaryButton, SecondaryButton, Skeleton, TextInput } from "@/components/ui";
import { api, ApiError, type PersonCard } from "@/lib/api";
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
  const { user } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<PersonCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [maxKm, setMaxKm] = useState("");
  const [profession, setProfession] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);

  async function load() {
    try {
      const params = new URLSearchParams();
      params.set("city", user?.city ?? "Yaoundé");
      if (user?.zone) params.set("zone", user.zone);
      if (availableOnly) params.set("available", "1");
      if (maxKm) params.set("maxKm", maxKm);
      if (profession.trim()) params.set("profession", profession.trim());
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
  }, [user?.city, user?.zone, availableOnly]);

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
  const available = Boolean(person.available);

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="type-h1 text-ink">{messages.world.peopleNearby}</h1>
        <Chip active={filtersOpen} onClick={() => setFiltersOpen((v) => !v)}>
          {messages.world.filters}
        </Chip>
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
          <TextInput value={maxKm} onChange={(e) => setMaxKm(e.target.value)} placeholder={messages.world.maxDistance} />
          <TextInput
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder={messages.world.professionFilter}
          />
          <PrimaryButton type="submit">{messages.common.apply}</PrimaryButton>
        </form>
      ) : null}
      <div className="relative mx-auto max-w-sm">
        {prev ? (
          <div className="pointer-events-none absolute -left-8 top-10 h-72 w-14 overflow-hidden rounded-card opacity-30 blur-[1px]">
            {prev.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prev.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        ) : null}
        {next ? (
          <div className="pointer-events-none absolute -right-8 top-10 h-72 w-14 overflow-hidden rounded-card opacity-30 blur-[1px]">
            {next.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={next.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        ) : null}
        <article className="fade-in overflow-hidden rounded-[28px] bg-surface shadow-elevated">
          <div className="relative h-80 bg-gradient-to-br from-accent/15 to-yellow/15">
            {person.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center type-display text-accent">{person.firstName[0]}</div>
            )}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent" aria-hidden />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
            <span className="absolute left-3 top-3">
              <AvailabilityBadge available={available} compact />
            </span>
            <div className="absolute inset-x-4 bottom-3">
              <p className="type-h2 flex items-center gap-1.5 text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.3)]">
                {person.firstName}
                {person.age != null ? `, ${person.age}` : ""}
                {person.certified ? <CertifiedMark /> : null}
              </p>
              <p className="type-body-sm inline-flex items-center gap-1 text-white/90">
                <PinIcon size={13} />
                {person.locationLabel}
                {person.distanceLabel
                  ? ` · ${person.distanceLabel}`
                  : person.distanceKm != null
                    ? ` · ${messages.world.distance.replace("{km}", String(person.distanceKm))}`
                    : ""}
              </p>
            </div>
          </div>
          <div className="space-y-2.5 p-5">
            {person.profession ? (
              <p className="type-body-sm inline-flex items-center gap-1.5 text-muted">
                <BriefcaseIcon />
                {person.profession}
              </p>
            ) : null}
            {person.activeMood ? (
              <p className="type-body-sm inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-3 py-2 font-medium text-accent">
                {person.activeMood.activity || person.activeMood.body}
              </p>
            ) : null}
            {person.likeTime ? (
              <p className="type-meta inline-flex items-center gap-1 text-accent">
                {messages.likeTime.ofDuration.replace("{duration}", person.likeTime.label)}
              </p>
            ) : null}
            {person.wishes?.length ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {person.wishes.slice(0, 3).map((w) => (
                  <Chip key={w.id}>{w.title}</Chip>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <SecondaryButton
                className="!w-full"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const conv = await api<{ id: string }>("/conversations/direct", {
                      method: "POST",
                      body: JSON.stringify({ userId: person.id }),
                    });
                    router.push(`/messages/${conv.id}`);
                  } catch (e) {
                    setError(e instanceof ApiError && e.code === "BLOCKED" ? messages.chat.blockedPeer : messages.common.error);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <MessageIcon size={15} />
                  {messages.world.message}
                </span>
              </SecondaryButton>
              {available ? (
                <PrimaryButton className="!w-full" onClick={() => setInviteOpen(true)}>
                  {person.activeMood ? messages.socialInvite.joinNow : messages.world.inviteJoin}
                </PrimaryButton>
              ) : (
                <span className="type-button grid place-items-center rounded-pill bg-surface-sunken py-3.5 text-muted">
                  {messages.world.unavailable}
                </span>
              )}
            </div>
            <Link href={`/u/${person.username}`} className="type-caption block pt-1 text-center font-semibold text-accent">
              @{person.username}
            </Link>
          </div>
        </article>
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          aria-label={messages.world.previousPerson}
          className="tap-scale grid h-12 w-12 place-items-center rounded-full bg-surface-sunken text-ink shadow-xs disabled:opacity-30"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          <ChevronLeftIcon size={20} />
        </button>
        <button
          type="button"
          className="type-button tap-scale rounded-pill bg-surface-sunken px-6 py-3 text-ink shadow-xs"
          onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
        >
          {messages.world.passPerson}
        </button>
        <button
          type="button"
          aria-label={messages.world.nextPerson}
          className="tap-scale grid h-12 w-12 place-items-center rounded-full bg-accent text-on-primary shadow-sm"
          onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
        >
          <ChevronRightIcon size={20} />
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
