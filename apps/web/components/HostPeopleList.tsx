"use client";

import Link from "next/link";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { EmptyState } from "@/components/ui";
import type { EventManagePerson } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function HostPeopleList({ people }: { people: EventManagePerson[] }) {
  const { messages } = useI18n();
  if (people.length === 0) {
    return <EmptyState title={messages.booking.manageEvent} body={messages.booking.hostPeopleEmpty} />;
  }
  return (
    <ul data-testid="host-people" className="space-y-2">
      {people.map((p) => (
        <li key={p.id}>
          <Link href={`/u/${p.username}`} className="flex items-center gap-3 rounded-[22px] bg-surface-sunken px-3 py-2.5">
            <Avatar
              src={p.avatarUrl}
              firstName={p.firstName}
              lastName={p.lastName}
              size="md"
              online={p.available}
            />
            <span className="min-w-0 flex-1">
              <span className="type-body-sm flex items-center gap-1 font-bold text-ink">
                {p.firstName} {p.lastName}
                {p.certified ? <CertifiedMark /> : null}
              </span>
              {p.profession ? <span className="type-caption block text-muted">{p.profession}</span> : null}
            </span>
            <span
              className={`type-caption shrink-0 rounded-md px-2 py-1 font-bold text-white ${p.paid ? "bg-success" : "bg-[#4a4f57]"}`}
            >
              {p.paid ? messages.booking.paidBadge : messages.booking.unpaidBadge}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
