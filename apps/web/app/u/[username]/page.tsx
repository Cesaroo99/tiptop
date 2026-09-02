"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { CalendarIcon, ChevronRightIcon, FlagIcon, HeartIcon, MessageIcon, PinIcon, PlayIcon, SparklesIcon } from "@/components/Icons";
import { LikeCapital } from "@/components/LikeCapital";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { LikeFaces, LikePlacedCard } from "@/components/LikeFaces";
import { ReportModal } from "@/components/ReportModal";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { WishList } from "@/components/WishList";
import { PostCard } from "@/components/PostCard";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { Chip, EmptyState, ErrorBanner, IconButton, Modal, Skeleton } from "@/components/ui";
import { api, ApiError, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatEventWhen } from "@/lib/time";

type EventPreview = {
  id: string;
  title: string;
  imageUrl: string | null;
  city: string;
  zone: string | null;
  startsAt: string;
  minAge: number | null;
  taken: number;
  host: { firstName: string; lastName: string; avatarUrl: string | null };
};

type Profile = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profession: string | null;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  city: string | null;
  zone: string | null;
  website: string | null;
  availability: string;
  isSelf: boolean;
  following: boolean;
  followersCount: number;
  followingCount: number;
  likedByMe: boolean;
  likeStats: {
    active: number;
    perHour: number;
    perDay: number;
    perMonth: number;
    ratio?: { value: number; unit: "hour" | "second" };
    receivedFrom?: Array<{
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatarUrl?: string | null;
    }>;
    placedOn?: { id: string; username: string; firstName: string; lastName: string; avatarUrl?: string | null } | null;
    likeTime?: {
      totalSeconds: number;
      weekSeconds: number;
      label: string;
      weekLabel: string;
      lastMilestone: { id: string; label: string; achievedAt: string | null } | null;
    };
  };
  posts: FeedItem[];
  eventsInterested?: EventPreview[];
  eventsLinked?: EventPreview[];
  moods?: Array<{ id: string; body: string; imageUrl: string | null; videoUrl: string | null; expiresAt: string }>;
};

export default function ProfilePage() {
  return (
    <AppShell>
      <ProfileView />
    </AppShell>
  );
}

function ProfileView() {
  const { username } = useParams<{ username: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soon, setSoon] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [tab, setTab] = useState<"posts" | "events" | "moods" | "wishes">("events");
  const [reportOpen, setReportOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);

  async function load() {
    try {
      setProfile(await api<Profile>(`/profiles/${username}`));
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  async function toggleFollow() {
    if (!profile) return;
    if (profile.following) {
      await api(`/users/${profile.id}/follow`, { method: "DELETE" });
      setProfile({ ...profile, following: false, followersCount: profile.followersCount - 1 });
    } else {
      await api(`/users/${profile.id}/follow`, { method: "POST" });
      setProfile({ ...profile, following: true, followersCount: profile.followersCount + 1 });
    }
  }

  async function like(confirmTransfer = false) {
    if (!profile || profile.isSelf) return;
    try {
      if (profile.likedByMe) {
        await api(`/users/${profile.id}/like`, { method: "DELETE" });
        setProfile({ ...profile, likedByMe: false });
        return;
      }
      await api(`/users/${profile.id}/like`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      setProfile({ ...profile, likedByMe: true });
      setTransfer(null);
      setBuy(false);
    } catch (e) {
      if (e instanceof ApiError) {
        const kind = likeErrorKind(String(e.code));
        if (kind === "buy") {
          setBuy(true);
          return;
        }
        if (kind === "transfer") {
          const preview = await api<{ wouldTransferFrom: { firstName: string; lastName: string } | null }>(
            `/users/${profile.id}/like/preview`,
          );
          setTransfer(
            preview.wouldTransferFrom
              ? `${preview.wouldTransferFrom.firstName} ${preview.wouldTransferFrom.lastName}`
              : "…",
          );
        }
      }
    }
  }

  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (!profile) return <Skeleton className="mx-4 mt-4 h-80" />;

  const available = profile.availability === "AVAILABLE";

  return (
    <div className="pb-8">
      <div className="relative h-40 bg-gradient-to-br from-accent/25 via-yellow/15 to-transparent">
        {profile.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="-mt-14 px-4 text-center">
        <Avatar
          src={profile.avatarUrl}
          firstName={profile.firstName}
          lastName={profile.lastName}
          size="xl"
          className="mx-auto ring-4 ring-[var(--bg)]"
        />
        <h1 className="type-h2 mt-3 flex items-center justify-center gap-1.5 text-ink">
          {profile.firstName} {profile.lastName}
          {profile.certified ? <CertifiedMark /> : null}
        </h1>
        <p className="type-body-sm text-muted">@{profile.username}</p>

        <div className="mt-3 flex justify-center">
          <AvailabilityBadge available={available} compact />
        </div>

        {profile.profession ? <p className="type-body-sm mt-2 text-ink">{profile.profession}</p> : null}
        {profile.bio ? <p className="type-body-sm mx-auto mt-2 max-w-sm leading-6 text-muted">{profile.bio}</p> : null}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {profile.city ? (
            <span className="type-caption inline-flex items-center gap-1 text-muted">
              <PinIcon size={13} />
              {messages.world.livesAt.replace("{place}", `${profile.city}${profile.zone ? `, ${profile.zone}` : ""}`)}
            </span>
          ) : null}
          {profile.website ? (
            <span className="type-caption text-accent">{profile.website}</span>
          ) : null}
        </div>
        <p className="type-body-sm mt-3 text-muted">
          <span className="font-semibold text-ink">{profile.followersCount}</span> {messages.social.followers}
          {"  ·  "}
          <span className="font-semibold text-ink">{profile.followingCount}</span> {messages.social.followingCount}
        </p>

        {!profile.isSelf ? (
          <div className="mt-5 flex flex-col items-center gap-3">
            <div className="flex w-full max-w-xs gap-2">
              <button
                type="button"
                className="tap-scale type-button flex flex-1 items-center justify-center gap-2 rounded-pill bg-accent px-5 py-3.5 text-on-primary shadow-sm transition hover:bg-accent-hover"
                onClick={async () => {
                  try {
                    const conv = await api<{ id: string }>("/conversations/direct", {
                      method: "POST",
                      body: JSON.stringify({ userId: profile.id }),
                    });
                    router.push(`/messages/${conv.id}`);
                  } catch {
                    setSoon(messages.chat.blockedPeer);
                  }
                }}
              >
                <MessageIcon size={16} />
                {messages.chat.messageCta}
              </button>
              <button
                type="button"
                className={`tap-scale type-button flex-1 rounded-pill border px-5 py-3.5 transition ${profile.following ? "border-border bg-surface text-ink hover:bg-surface-sunken" : "border-accent bg-accent-soft text-accent hover:bg-accent/15"}`}
                onClick={() => void toggleFollow()}
              >
                {profile.following ? messages.social.unfollow : messages.social.follow}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <IconButton
                label={profile.likedByMe ? messages.social.likeHere : messages.social.likePlace}
                tone={profile.likedByMe ? "accent" : "neutral"}
                onClick={() => void like(false)}
              >
                <HeartIcon size={17} filled={profile.likedByMe} />
              </IconButton>
              <Link
                href={`/invite/${profile.id}`}
                aria-label={messages.world.invite}
                className="tap-scale grid h-10 w-10 place-items-center rounded-full bg-surface-sunken text-muted transition hover:brightness-95"
              >
                <CalendarIcon size={17} />
              </Link>
              <IconButton label={messages.socialInvite.proposeOuting} onClick={() => setProposeOpen(true)}>
                <SparklesIcon size={17} />
              </IconButton>
              <IconButton label={messages.admin.report} tone="danger" onClick={() => setReportOpen(true)}>
                <FlagIcon size={15} />
              </IconButton>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <Link href="/account" className="type-body-sm font-semibold text-accent">
              {messages.account.title}
            </Link>
          </div>
        )}
      </div>
      <div className="mt-6 space-y-3 px-4">
        <LikeCapital time={profile.likeStats.likeTime} forSelf={profile.isSelf} />
        <LikeFaces
          title={profile.isSelf ? messages.wallet.receivedTitle : messages.social.likeReceivedTitle}
          people={profile.likeStats.receivedFrom ?? []}
        />
        <LikePlacedCard
          title={profile.isSelf ? messages.wallet.placedTitle : messages.social.likeGivenTitle}
          person={profile.likeStats.placedOn ?? null}
          idle={messages.social.likeIdle}
        />
      </div>
      <div className="no-scrollbar mt-6 flex justify-center gap-2 overflow-x-auto px-4">
        {(
          [
            ["events", messages.social.events],
            ["posts", messages.social.postsTab],
            ["moods", messages.social.moodsTab],
            ["wishes", messages.wishes.tab],
          ] as const
        ).map(([key, label]) => (
          <Chip key={key} active={tab === key} onClick={() => setTab(key)}>
            {label}
          </Chip>
        ))}
      </div>
      <div className="mt-6 px-4">
        {tab === "posts" ? (
          profile.posts.length === 0 ? (
            <EmptyState title={messages.social.postsTab} body={messages.home.emptyBody} />
          ) : (
            <div className="space-y-3">
              {profile.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )
        ) : null}
        {tab === "events" ? (
          <div className="space-y-6">
            <EventRail title={messages.world.eventsInterested} items={profile.eventsInterested ?? []} />
            <EventRail
              title={messages.world.eventsLinked.replace("{n}", String(profile.eventsLinked?.length ?? 0))}
              items={profile.eventsLinked ?? []}
            />
          </div>
        ) : null}
        {tab === "moods" ? (
          profile.moods?.length ? (
            <div className="grid grid-cols-2 gap-3">
              {profile.moods.map((m) => (
                <Link key={m.id} href={`/mood?start=${m.id}`} className="relative overflow-hidden rounded-card bg-surface shadow-card">
                  {m.videoUrl ? (
                    <video src={m.videoUrl} muted playsInline preload="metadata" className="h-28 w-full object-cover" />
                  ) : m.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.imageUrl} alt="" className="h-28 w-full object-cover" />
                  ) : (
                    <div className="h-28 bg-accent/10" />
                  )}
                  {m.videoUrl ? (
                    <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 p-1 text-white">
                      <PlayIcon size={10} />
                    </span>
                  ) : null}
                  <p className="p-2 text-xs text-ink">{m.body}</p>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title={messages.social.moodsTab} body={messages.world.moodEmptyBody} />
          )
        ) : null}
        {tab === "wishes" ? <WishList ownerId={profile.id} isSelf={profile.isSelf} /> : null}
      </div>
      <Modal open={Boolean(soon)} title="TipTop" onClose={() => setSoon(null)}>
        {soon}
      </Modal>
      <LikeDialogs
        transferName={transfer}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void like(true)}
        onCloseBuy={() => setBuy(false)}
      />
      <ReportModal
        open={reportOpen}
        kind="USER"
        targetUserId={profile.id}
        onClose={() => setReportOpen(false)}
        onSent={() => setTimeout(() => setReportOpen(false), 1200)}
      />
      <SocialInviteModal
        open={proposeOpen}
        inviteeId={profile.id}
        defaultContext="MEETUP"
        onClose={() => setProposeOpen(false)}
      />
    </div>
  );
}

function EventRail({ title, items }: { title: string; items: EventPreview[] }) {
  const { locale, messages } = useI18n();
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="type-heading text-ink">{title}</p>
        <span className="type-caption inline-flex items-center gap-0.5 font-semibold text-accent">
          {messages.world.seeAll}
          <ChevronRightIcon size={14} />
        </span>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {items.map((e) => (
          <Link
            key={e.id}
            href={`/events/${e.id}`}
            className="tap-scale w-64 shrink-0 overflow-hidden rounded-card bg-surface shadow-card transition hover:shadow-elevated"
          >
            <div className="relative h-36">
              {e.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full bg-accent/10" />
              )}
              <span className="type-caption absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 font-semibold text-ink backdrop-blur-sm">
                {e.taken} {messages.world.peopleLinked}
              </span>
            </div>
            <div className="p-3">
              <p className="type-body-sm truncate font-semibold text-ink">{e.title}</p>
              <p className="type-caption text-muted">
                {e.host.firstName} {e.host.lastName}
              </p>
              <p className="type-caption font-medium text-yellow">{formatEventWhen(e.startsAt, locale)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
