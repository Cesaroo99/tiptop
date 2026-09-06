"use client";

import Link from "next/link";
import { useState } from "react";
import type { PersonCard } from "@/lib/api";
import { personWhyLines } from "@/lib/discovery-why";
import { personDistanceFromMe } from "@/lib/person-distance";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useViewerLocation } from "@/lib/viewer-location";
import { Avatar } from "./Avatar";
import { SocialInviteModal } from "./SocialInviteModal";

export function AvailableInviteCard({
  person,
}: {
  person: PersonCard;
  onChanged?: (next: PersonCard) => void;
}) {
  const { messages } = useI18n();
  const { user } = useSession();
  const { origin } = useViewerLocation(user ?? undefined);
  const [inviteOpen, setInviteOpen] = useState(false);
  const distance = personDistanceFromMe(origin, person);
  const why = personWhyLines(person, messages)[0];
  const hint = person.activeMood?.activity || person.activeMood?.body || messages.home.justAvailableBody;

  return (
    <article data-kind="invite" className="flex items-center gap-3 rounded-card bg-surface px-3.5 py-3 shadow-card">
      <Link href={`/u/${person.username}`} className="shrink-0">
        <Avatar
          src={person.avatarUrl}
          firstName={person.firstName}
          lastName={person.lastName}
          size="md"
          online
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="type-body-sm font-bold text-ink">
          {messages.home.justAvailable.replace("{name}", person.firstName)}
        </p>
        <p className="type-caption mt-0.5 truncate text-accent">
          {why ?? (distance ? `${distance} ${messages.world.fromYou}` : messages.world.whyNearbyAvailable)}
        </p>
        <p className="type-caption mt-0.5 truncate text-muted">{hint}</p>
      </div>
      <button
        type="button"
        onClick={() => setInviteOpen(true)}
        className="tap-scale type-caption shrink-0 rounded-full bg-accent px-3 py-2 font-semibold text-on-primary"
      >
        {messages.world.inviteNamed.replace("{name}", person.firstName)}
      </button>
      <SocialInviteModal
        open={inviteOpen}
        inviteeId={person.id}
        defaultContext="MEETUP"
        defaultLabel={person.activeMood?.activity ?? ""}
        onClose={() => setInviteOpen(false)}
      />
    </article>
  );
}
