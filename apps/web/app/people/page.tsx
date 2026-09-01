"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorBanner, PrimaryButton, Skeleton, TextInput } from "@/components/ui";
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
      <h1 className="type-h1 mb-2 text-accent">{messages.world.peopleNearby}</h1>
      <button type="button" className="mb-3 text-sm font-semibold text-accent" onClick={() => setFiltersOpen((v) => !v)}>
        {messages.world.filters}
      </button>
      {filtersOpen ? (
        <form
          className="mb-4 space-y-2 rounded-card bg-surface p-3 shadow-card"
          onSubmit={(e) => {
            e.preventDefault();
            void load();
          }}
        >
          <label className="flex items-center gap-2 type-body-sm">
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
          <div className="pointer-events-none absolute -left-10 top-8 h-72 w-16 overflow-hidden rounded-card opacity-40">
            {prev.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prev.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        ) : null}
        {next ? (
          <div className="pointer-events-none absolute -right-10 top-8 h-72 w-16 overflow-hidden rounded-card opacity-40">
            {next.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={next.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
        ) : null}
        <article className="overflow-hidden rounded-[28px] bg-surface shadow-card">
          <div className="relative h-80 bg-accent/10">
            {person.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center type-display text-accent">{person.firstName[0]}</div>
            )}
            <span
              className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${available ? "bg-success text-white" : "bg-white/90 text-muted"}`}
            >
              {available ? `🟢 ${messages.world.available}` : `⚪ ${messages.world.unavailable}`}
            </span>
          </div>
          <div className="space-y-2 p-5">
            <p className="text-center type-h2 text-ink">
              {person.firstName} {person.lastName}{" "}
              {person.age != null ? messages.world.age.replace("{age}", String(person.age)) : ""}{" "}
              {person.certified ? <CertifiedMark /> : null}
            </p>
            {person.profession ? <p className="text-center type-body-sm text-muted">💼 {person.profession}</p> : null}
            <p className="text-center type-body-sm text-muted">
              📍 {person.locationLabel}
              {person.distanceLabel
                ? ` · ${person.distanceLabel}`
                : person.distanceKm != null
                  ? ` · ${messages.world.distance.replace("{km}", String(person.distanceKm))}`
                  : ""}
            </p>
            {person.likeTime ? (
              <p className="text-center type-meta text-accent">
                ♥ {messages.likeTime.ofDuration.replace("{duration}", person.likeTime.label)}
              </p>
            ) : null}
            {person.wishes?.length ? (
              <ul className="type-caption text-muted">
                {person.wishes.slice(0, 3).map((w) => (
                  <li key={w.id}>· {w.title}</li>
                ))}
              </ul>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                className="rounded-pill bg-[var(--border)] py-3 disabled:opacity-40"
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
                {messages.world.message}
              </button>
              {available ? (
                <Link
                  href={`/invite/${person.id}`}
                  className="rounded-pill bg-accent py-3 text-center font-semibold text-white"
                >
                  {messages.world.inviteJoin}
                </Link>
              ) : (
                <span className="rounded-pill bg-[var(--border)] py-3 text-center text-sm text-muted">
                  {messages.world.unavailable}
                </span>
              )}
            </div>
            {person.wishes?.[0] ? (
              <Link href={`/u/${person.username}`} className="mt-1 block text-center text-sm text-accent">
                {messages.wishes.offer}
              </Link>
            ) : null}
            <Link href={`/u/${person.username}`} className="mt-1 block text-center text-sm text-accent">
              @{person.username}
            </Link>
          </div>
        </article>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          type="button"
          className="rounded-pill bg-[var(--border)] py-3 text-sm"
          disabled={index === 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          {messages.world.previousPerson}
        </button>
        <button
          type="button"
          className="rounded-pill bg-[var(--border)] py-3 text-sm"
          onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
        >
          {messages.world.passPerson}
        </button>
        <PrimaryButton className="!w-auto" onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}>
          {messages.world.nextPerson}
        </PrimaryButton>
      </div>
    </div>
  );
}
