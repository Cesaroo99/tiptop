"use client";

import Link from "next/link";
import { useState } from "react";
import { presenceFromDeclared, type PresenceState } from "@tiptop/domain";
import { api, ApiError, type PersonCard } from "@/lib/api";
import { personDistanceFromMe } from "@/lib/person-distance";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { viewerLikeActive } from "@/lib/like-feed";
import { useLikePlacement } from "@/lib/like-placement";
import { useViewerLocation } from "@/lib/viewer-location";
import { personWhyLines } from "@/lib/discovery-why";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { CertifiedMark } from "./Avatar";
import { BriefcaseIcon, CheckIcon, HeartIcon, RouteIcon, UserPlusIcon } from "./Icons";
import { LikeDialogs, likeErrorKind } from "./LikeDialogs";
import { SocialInviteModal } from "./SocialInviteModal";

export function NearbyPersonCard({
  person,
  onChanged,
}: {
  person: PersonCard;
  onChanged?: (next: PersonCard) => void;
}) {
  const { messages } = useI18n();
  const { user } = useSession();
  const { origin } = useViewerLocation(user ?? undefined);
  const { placement, ready, refresh } = useLikePlacement();
  const [busy, setBusy] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const liked = viewerLikeActive(placement, "user", person.id, Boolean(person.likedByMe), ready);
  const presence = (person.presence ?? presenceFromDeclared(person.availability)) as PresenceState;
  const friend = person.addedAsFriend || person.circle === "FRIEND";
  const later = person.circle === "LATER";
  const computed = personDistanceFromMe(origin, person);
  const distanceText =
    computed ??
    person.distanceLabel ??
    (person.distanceKm != null ? messages.world.distance.replace("{km}", String(person.distanceKm)) : null);
  const circleLabel =
    person.circle === "FRIEND"
      ? messages.world.circleFriend
      : person.circle === "LATER"
        ? messages.world.circleLater
        : messages.world.circleAround;

  async function like(confirmTransfer = true) {
    if (busy) return;
    setBusy(true);
    try {
      if (liked) {
        await api(`/users/${person.id}/like`, { method: "DELETE" });
        onChanged?.({ ...person, likedByMe: false });
        await refresh();
        return;
      }
      await api(`/users/${person.id}/like`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      onChanged?.({ ...person, likedByMe: true });
      await refresh();
      setTransfer(null);
      setBuy(false);
    } catch (e) {
      if (e instanceof ApiError) {
        const kind = likeErrorKind(String(e.code));
        if (kind === "buy") {
          setBuy(true);
          return;
        }
        if (kind === "transfer") setTransfer(`${person.firstName} ${person.lastName}`);
      }
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
    <article data-kind="person" className="fade-in overflow-hidden rounded-[26px] bg-surface shadow-elevated">
      <div className="relative">
        <Link href={`/u/${person.username}`} className="relative block h-52 bg-gradient-to-br from-accent/15 to-yellow/15">
          {person.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={person.avatarUrl} alt="" draggable={false} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center type-display text-accent">{person.firstName[0]}</div>
          )}
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-10">
            <AvailabilityBadge presence={presence} compact />
            <span className="type-caption rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white">{circleLabel}</span>
          </div>
        </Link>
        {person.circle !== "FRIEND" ? (
          <button
            type="button"
            disabled={busy || person.addedAsFriend}
            aria-label={person.addedAsFriend ? messages.world.addedFriend : messages.world.addFriend}
            onClick={() => void addFriend()}
            className={`tap-scale absolute left-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full shadow-sm ${
              person.addedAsFriend ? "bg-accent text-on-primary" : "bg-black/45 text-white backdrop-blur-sm"
            }`}
          >
            {person.addedAsFriend ? <CheckIcon size={15} /> : <UserPlusIcon size={16} />}
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          aria-label={liked ? messages.social.likeHere : messages.social.likePlace}
          onClick={() => void like()}
          className={`tap-scale absolute right-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full shadow-sm ${
            liked ? "bg-accent text-on-primary" : "bg-black/45 text-white backdrop-blur-sm"
          }`}
        >
          <HeartIcon size={16} filled={liked} />
        </button>
      </div>
      <div className="space-y-2.5 px-4 pb-4 pt-3 text-center">
        <h2 className="min-w-0">
          <span className="type-h2 line-clamp-2 break-words text-ink">
            {person.firstName} {person.lastName}
            {person.certified ? (
              <span className="ml-1 inline-block align-middle">
                <CertifiedMark />
              </span>
            ) : null}
          </span>
          <span className="type-caption mt-1 flex min-w-0 items-center justify-center gap-1.5 text-muted">
            {person.age != null ? <span className="shrink-0">{messages.world.age.replace("{age}", String(person.age))}</span> : null}
            {person.age != null && person.profession ? <span aria-hidden>·</span> : null}
            {person.profession ? (
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <BriefcaseIcon size={13} />
                <span className="truncate">{person.profession}</span>
              </span>
            ) : null}
          </span>
        </h2>
        <p className="type-caption inline-flex max-w-full items-center justify-center gap-1.5 font-bold text-accent">
          <RouteIcon size={13} />
          <span className="truncate">
            {distanceText ? `${distanceText} ${messages.world.fromYou}` : person.locationLabel ?? messages.world.approximate}
          </span>
        </p>
        {personWhyLines(person, messages).map((line) => (
          <p key={line} className="type-caption mx-auto font-medium text-accent">
            {line}
          </p>
        ))}
        {person.activeMood ? (
          <p className="type-caption mx-auto truncate rounded-lg bg-accent-soft px-3 py-1.5 font-medium text-accent">
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
        {person.circle !== "FRIEND" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggleLater()}
            className="type-caption w-full py-0.5 text-center font-medium text-muted"
          >
            {later ? messages.world.removeFromLater : messages.world.saveForLater}
          </button>
        ) : null}
      </div>
      <SocialInviteModal
        open={inviteOpen}
        inviteeId={person.id}
        defaultContext="MEETUP"
        defaultLabel={person.activeMood?.activity ?? ""}
        onClose={() => setInviteOpen(false)}
      />
      <LikeDialogs
        transferName={transfer}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void like(true)}
        onCloseBuy={() => setBuy(false)}
      />
    </article>
  );
}
