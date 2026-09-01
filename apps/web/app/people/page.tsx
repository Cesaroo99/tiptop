"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorBanner, PrimaryButton, Skeleton } from "@/components/ui";
import { api, ApiError, type PersonCard } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

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

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-lg font-semibold">{messages.world.peopleTitle}</h1>
      <div className="rounded-card bg-surface p-5 shadow-card">
        <div className="mx-auto h-40 w-40 rounded-full bg-accent/20" />
        <p className="mt-4 text-center text-xl font-bold text-ink">
          {person.firstName} {person.lastName} {person.certified ? "✓" : ""}
        </p>
        {person.age != null ? (
          <p className="text-center text-sm text-muted">{messages.world.age.replace("{age}", String(person.age))}</p>
        ) : null}
        {person.profession ? <p className="text-center text-sm text-muted">{person.profession}</p> : null}
        <p className="mt-2 text-center text-sm text-muted">
          {person.locationLabel}
          {person.approximate ? ` · ${messages.world.approximate}` : ""}
          {person.distanceKm != null ? ` · ${messages.world.distance.replace("{km}", String(person.distanceKm))}` : ""}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2">
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
            {messages.world.invite}
          </Link>
        </div>
        <Link href={`/u/${person.username}`} className="mt-3 block text-center text-sm text-accent">
          @{person.username}
        </Link>
      </div>
      <PrimaryButton className="mt-4" onClick={() => setIndex((i) => i + 1)}>
        {messages.world.nextPerson}
      </PrimaryButton>
    </div>
  );
}
