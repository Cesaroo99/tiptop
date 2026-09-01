"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorBanner, PrimaryButton, Skeleton } from "@/components/ui";
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

  async function load() {
    try {
      const data = await api<{ items: PersonCard[] }>(
        `/discovery/people?city=${encodeURIComponent(user?.city ?? "Yaoundé")}&zone=${encodeURIComponent(user?.zone ?? "")}`,
      );
      setItems(data.items);
      setIndex(0);
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.city, user?.zone]);

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

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-xl font-bold text-accent">{messages.world.peopleTitle}</h1>
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
              <div className="grid h-full place-items-center text-4xl font-bold text-accent">
                {person.firstName[0]}
              </div>
            )}
          </div>
          <div className="space-y-2 p-5">
            <p className="text-center text-xl font-bold text-ink">
              {person.firstName} {person.lastName}{" "}
              {person.age != null ? messages.world.age.replace("{age}", String(person.age)) : ""}{" "}
              {person.certified ? <CertifiedMark /> : null}
            </p>
            {person.profession ? <p className="text-center text-sm text-muted">💼 {person.profession}</p> : null}
            <p className="text-center text-sm text-muted">
              📍 {person.locationLabel}
              {person.distanceKm != null ? ` · ${messages.world.distance.replace("{km}", String(person.distanceKm))}` : ""}
            </p>
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
              <Link
                href={`/invite/${person.id}`}
                className="rounded-pill bg-accent py-3 text-center font-semibold text-white"
              >
                {messages.world.inviteNamed.replace("{name}", person.firstName)}
              </Link>
            </div>
            <Link href={`/u/${person.username}`} className="mt-1 block text-center text-sm text-accent">
              @{person.username}
            </Link>
          </div>
        </article>
      </div>
      <PrimaryButton className="mt-4" onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}>
        {messages.world.nextPerson}
      </PrimaryButton>
    </div>
  );
}
