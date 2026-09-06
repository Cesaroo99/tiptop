"use client";

import Link from "next/link";
import { useState } from "react";
import { presenceFromDeclared } from "@tiptop/domain";
import { api, ApiError, type PersonCard } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { viewerLikeActive } from "@/lib/like-feed";
import { useLikePlacement } from "@/lib/like-placement";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { CertifiedMark } from "./Avatar";
import { HeartIcon, UserPlusIcon, CheckIcon } from "./Icons";
import { SocialInviteModal } from "./SocialInviteModal";
import { personWhyLines } from "@/lib/discovery-why";

export function FeedPersonCard({
  person,
  onChanged,
}: {
  person: PersonCard;
  onChanged?: (next: PersonCard) => void;
}) {
  const { messages } = useI18n();
  const { placement, ready, refresh } = useLikePlacement();
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const liked = viewerLikeActive(placement, "user", person.id, Boolean(person.likedByMe), ready);
  const presence = (person.presence ?? presenceFromDeclared(person.availability)) as "AVAILABLE" | "UNSURE" | "UNAVAILABLE";
  const friend = person.addedAsFriend || person.circle === "FRIEND";
  const later = person.circle === "LATER";

  async function like() {
    if (busy) return;
    setBusy(true);
    try {
      if (liked) {
        await api(`/users/${person.id}/like`, { method: "DELETE" });
        onChanged?.({ ...person, likedByMe: false });
      } else {
        await api(`/users/${person.id}/like`, { method: "POST", body: JSON.stringify({ confirmTransfer: true }) });
        onChanged?.({ ...person, likedByMe: true });
      }
      await refresh();
    } catch (e) {
      if (!(e instanceof ApiError)) return;
    } finally {
      setBusy(false);
    }
  }

  async function addFriend() {
    if (friend || busy) return;
    setBusy(true);
    try {
      await api(`/contacts/${person.id}`, { method: "POST" });
      onChanged?.({ ...person, addedAsFriend: true, circle: "FRIEND" });
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  async function toggleLater() {
    if (busy || friend) return;
    setBusy(true);
    try {
      await api(`/invite-later/${person.id}`, { method: later ? "DELETE" : "POST" });
      onChanged?.({ ...person, circle: later ? "NEARBY" : "LATER" });
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-card bg-surface shadow-card" data-kind="person">
      <div className="relative h-52 bg-gradient-to-br from-accent/15 to-yellow/15">
        <Link href={`/u/${person.username}`} className="block h-full">
          {person.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center type-display text-accent">{person.firstName[0]}</div>
          )}
        </Link>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-10">
          <AvailabilityBadge presence={presence} compact />
        </div>
        {!friend ? (
          <button
            type="button"
            disabled={busy}
            aria-label={messages.world.addFriend}
            onClick={() => void addFriend()}
            className="tap-scale absolute left-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white"
          >
            <UserPlusIcon size={16} />
          </button>
        ) : (
          <span className="absolute left-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-accent text-on-primary">
            <CheckIcon size={15} />
          </span>
        )}
        <button
          type="button"
          disabled={busy}
          aria-label={liked ? messages.social.likeHere : messages.social.likePlace}
          onClick={() => void like()}
          className={`tap-scale absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full ${
            liked ? "bg-accent text-on-primary" : "bg-black/45 text-white"
          }`}
        >
          <HeartIcon size={16} filled={liked} />
        </button>
      </div>
      <div className="space-y-2.5 px-4 py-3 text-center">
        <h2 className="type-h2 text-ink">
          {person.firstName} {person.lastName}
          {person.certified ? (
            <span className="ml-1 inline-block align-middle">
              <CertifiedMark />
            </span>
          ) : null}
        </h2>
        <p className="type-caption text-muted">
          {[person.profession, person.locationLabel ?? person.distanceLabel].filter(Boolean).join(" · ")}
        </p>
        {personWhyLines(person, messages).map((line) => (
          <p key={line} className="type-caption font-medium text-accent">
            {line}
          </p>
        ))}
        {person.activeMood ? (
          <p className="type-caption truncate rounded-lg bg-accent-soft px-3 py-1.5 font-medium text-accent">
            {person.activeMood.activity || person.activeMood.body}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-2">
          {presence === "AVAILABLE" ? (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="tap-scale type-caption h-9 truncate rounded-full bg-accent px-3 font-semibold text-on-primary"
            >
              {messages.world.inviteNamed.replace("{name}", person.firstName)}
            </button>
          ) : (
            <span className="type-caption grid h-9 place-items-center rounded-full bg-surface-sunken font-semibold text-muted">
              {messages.world.unavailable}
            </span>
          )}
          <button
            type="button"
            disabled={busy || friend}
            onClick={() => void toggleLater()}
            className="tap-scale type-caption h-9 rounded-full bg-surface-sunken px-3 font-semibold text-ink disabled:opacity-50"
          >
            {later ? messages.world.removeFromLater : messages.booking.saveForLater}
          </button>
        </div>
      </div>
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
