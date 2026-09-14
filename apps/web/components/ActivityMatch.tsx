"use client";

import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { PrimaryButton } from "./ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { MatchPerson } from "@/lib/intelligence";

export function ActivityMatch({
  eventId,
  title,
  startsAt,
  city,
  zone,
}: {
  eventId: string;
  title: string;
  startsAt: string;
  city: string;
  zone: string | null;
}) {
  const { messages } = useI18n();
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState<MatchPerson[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    api<{ enabled: boolean; items: MatchPerson[] }>(`/intelligence/matches?eventId=${encodeURIComponent(eventId)}`)
      .then((data) => {
        setEnabled(data.enabled);
        setItems(data.items ?? []);
      })
      .catch(() => setItems([]));
  }, [eventId]);

  if (items === null) return null;
  if (!enabled) {
    return <p className="type-caption text-muted">{messages.intel.matchOff}</p>;
  }

  async function propose() {
    const res = await api<{ eventId: string }>(`/intelligence/meetups`, {
      method: "POST",
      body: JSON.stringify({ title, startsAt, city, zone, peerIds: picked }),
    });
    setDone(res.eventId);
  }

  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <h2 className="type-heading text-ink">{messages.intel.matchTitle}</h2>
      {items.length === 0 ? <p className="type-body-sm mt-2 text-muted">{messages.intel.matchEmpty}</p> : null}
      <ul className="mt-3 space-y-2">
        {items.map((person) => {
          const on = picked.includes(person.id);
          return (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => setPicked((cur) => (on ? cur.filter((id) => id !== person.id) : [...cur, person.id]))}
                className={`flex w-full items-center gap-3 rounded-[22px] px-3 py-2.5 text-left ${on ? "bg-accent-soft" : "bg-surface-sunken"}`}
              >
                <Avatar src={person.avatarUrl} firstName={person.firstName} lastName={person.lastName} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="type-body-sm block font-semibold text-ink">
                    {person.firstName} {person.lastName}
                  </span>
                  <span className="type-caption text-muted">
                    {person.available ? messages.intel.matchAvailable : ""} {person.distanceLabel ?? ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {picked.length > 0 ? (
        <div className="mt-3">
          <PrimaryButton onClick={() => void propose()}>{messages.intel.doThis}</PrimaryButton>
        </div>
      ) : null}
      {done ? (
        <p className="type-caption mt-2 text-accent">
          {messages.intel.doThis} → /events/{done}
        </p>
      ) : null}
    </section>
  );
}
