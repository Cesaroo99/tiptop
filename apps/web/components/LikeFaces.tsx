"use client";

import Link from "next/link";
import { Avatar } from "./Avatar";
import { useI18n } from "@/lib/i18n";

export type LikeFace = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

export function LikeFaces({
  title,
  people,
  empty,
}: {
  title: string;
  people: LikeFace[];
  empty?: string;
}) {
  const { messages } = useI18n();
  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold text-accent">{title}</p>
      {people.length === 0 ? (
        <p className="text-sm text-muted">{empty ?? messages.social.likeEmptyReceived}</p>
      ) : (
        <ul className="space-y-2">
          {people.map((p) => (
            <li key={p.id}>
              <Link href={`/u/${p.username}`} className="flex items-center gap-3">
                <Avatar src={p.avatarUrl} firstName={p.firstName} lastName={p.lastName} size={40} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {p.firstName} {p.lastName}
                  </p>
                  <p className="text-xs text-muted">@{p.username}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function LikePlacedCard({
  title,
  person,
  idle,
}: {
  title: string;
  person: LikeFace | null;
  idle: string;
}) {
  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <p className="mb-3 text-sm font-semibold text-accent">{title}</p>
      {person ? (
        <Link href={`/u/${person.username}`} className="flex items-center gap-3">
          <Avatar src={person.avatarUrl} firstName={person.firstName} lastName={person.lastName} size={48} />
          <div>
            <p className="font-semibold text-ink">
              {person.firstName} {person.lastName}
            </p>
            <p className="text-xs text-muted">@{person.username}</p>
          </div>
        </Link>
      ) : (
        <p className="text-sm text-muted">{idle}</p>
      )}
    </section>
  );
}
