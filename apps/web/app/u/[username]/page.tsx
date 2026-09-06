"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PresencePicker } from "@/components/PresencePicker";
import {
  BriefcaseIcon,
  CalendarIcon,
  ChevronRightIcon,
  FlagIcon,
  HeartIcon,
  ImageIcon,
  InfoIcon,
  LinkIcon,
  MessageIcon,
  MoreIcon,
  PinIcon,
  PlayIcon,
  PlusIcon,
  SparklesIcon,
} from "@/components/Icons";
import { LikeCapital } from "@/components/LikeCapital";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { OptionsSheet } from "@/components/OptionsSheet";
import { ReportModal } from "@/components/ReportModal";
import { SocialInviteModal } from "@/components/SocialInviteModal";
import { WishList } from "@/components/WishList";
import { PostCard } from "@/components/PostCard";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { EmptyState, ErrorBanner, Modal, Skeleton } from "@/components/ui";
import { api, ApiError, type FeedItem } from "@/lib/api";
import { applySoleLike, replaceFeedItem } from "@/lib/like-feed";
import { useLikePlacement } from "@/lib/like-placement";
import { useI18n } from "@/lib/i18n";
import { viewerLikeActive } from "@/lib/like-feed";
import { useSession } from "@/lib/session";
import { formatEventWhen } from "@/lib/time";
import { presenceState } from "@tiptop/domain";

type EventPreview = {
  id: string;
  title: string;
  imageUrl: string | null;
  city: string;
  zone: string | null;
  startsAt: string;
  minAge: number | null;
  taken: number;
  hosted?: boolean;
  showOnProfile?: boolean;
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
  country?: string | null;
  website: string | null;
  availability: string;
  availabilityUntil?: string | null;
  isSelf: boolean;
  isFriend?: boolean;
  following: boolean;
  followersCount: number;
  followingCount: number;
  likedByMe: boolean;
  likeStats: {
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
  const { refresh: refreshSession } = useSession();
  const { refresh: refreshPlacement, placement, ready } = useLikePlacement();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [soon, setSoon] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [tab, setTab] = useState<"posts" | "events" | "moods">("events");
  const [reportOpen, setReportOpen] = useState(false);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [friendBusy, setFriendBusy] = useState(false);

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

  async function addFriend() {
    if (!profile || profile.isSelf || profile.isFriend) return;
    setFriendBusy(true);
    try {
      await api(`/contacts/${profile.id}`, { method: "POST" });
      setProfile({ ...profile, isFriend: true });
    } catch {
      setError(messages.common.error);
    } finally {
      setFriendBusy(false);
    }
  }

  async function openMessage() {
    if (!profile) return;
    try {
      const conv = await api<{ id: string }>("/conversations/direct", {
        method: "POST",
        body: JSON.stringify({ userId: profile.id }),
      });
      router.push(`/messages/${conv.id}`);
    } catch {
      setSoon(messages.chat.blockedPeer);
    }
  }

  async function like(confirmTransfer = false) {
    if (!profile || profile.isSelf) return;
    try {
      if (viewerLikeActive(placement, "user", profile.id, profile.likedByMe, ready)) {
        await api(`/users/${profile.id}/like`, { method: "DELETE" });
        setProfile({ ...profile, likedByMe: false });
        await refreshPlacement();
        return;
      }
      await api(`/users/${profile.id}/like`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      setProfile({ ...profile, likedByMe: true });
      await refreshPlacement();
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

  async function setMyPresence(availability: "AVAILABLE" | "BUSY" | "HIDDEN") {
    if (!profile?.isSelf) return;
    setStatusBusy(true);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ availability, ttlHours: 4 }),
      });
      await refreshSession();
      setProfile({
        ...profile,
        availability,
        availabilityUntil: availability === "AVAILABLE" ? new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() : null,
      });
    } catch {
      setError(messages.common.error);
    } finally {
      setStatusBusy(false);
    }
  }

  async function toggleLinkedVisibility(eventId: string, show: boolean) {
    await api(`/events/${eventId}/profile-visibility`, {
      method: "PATCH",
      body: JSON.stringify({ show }),
    });
    setProfile((cur) =>
      cur
        ? {
            ...cur,
            eventsLinked: (cur.eventsLinked ?? []).map((e) => (e.id === eventId ? { ...e, showOnProfile: show } : e)),
          }
        : cur,
    );
  }

  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (!profile) return <Skeleton className="mx-4 mt-4 h-80" />;

  const presence = presenceState({
    availability: (profile.availability === "BUSY" || profile.availability === "AVAILABLE" ? profile.availability : "HIDDEN") as
      | "HIDDEN"
      | "BUSY"
      | "AVAILABLE",
    availabilityUntil: profile.availabilityUntil ? new Date(profile.availabilityUntil) : null,
  });
  const liked = viewerLikeActive(placement, "user", profile.id, profile.likedByMe, ready);
  const place = [profile.city, profile.country === "CM" ? messages.world.countryCM : profile.country]
    .filter(Boolean)
    .join(", ");
  const websiteLabel = profile.website?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? null;

  return (
    <div className="pb-10">
      <div className="relative h-36 bg-gradient-to-br from-accent/20 via-yellow/10 to-transparent">
        {profile.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="-mt-12 px-4 text-center">
        <Avatar
          src={profile.avatarUrl}
          firstName={profile.firstName}
          lastName={profile.lastName}
          size="xl"
          online={presence === "AVAILABLE"}
          className="mx-auto ring-4 ring-[var(--bg)]"
        />
        <h1 className="type-h2 mt-3 flex items-center justify-center gap-1.5 text-ink">
          {profile.firstName} {profile.lastName}
          {profile.certified ? <CertifiedMark /> : null}
        </h1>
        {profile.profession ? <p className="type-body-sm mt-1 text-muted">{profile.profession}</p> : null}

        {profile.isSelf ? (
          <div className="mt-4 space-y-3">
            <PresencePicker value={presence} busy={statusBusy} onChange={(k) => void setMyPresence(k)} />
            <p className="type-caption mx-auto max-w-xs leading-5 text-muted">{messages.account.statusHint}</p>
            <Link href="/account" className="type-body-sm inline-block font-semibold text-accent">
              {messages.account.title}
            </Link>
          </div>
        ) : (
          <div className="mx-auto mt-4 flex max-w-sm items-center gap-2">
            {profile.isFriend ? (
              <button
                type="button"
                className="tap-scale type-button flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill bg-accent px-3 text-on-primary shadow-sm"
                onClick={() => void openMessage()}
              >
                <MessageIcon size={15} />
                {messages.chat.messageCta}
              </button>
            ) : (
              <button
                type="button"
                disabled={friendBusy}
                className="tap-scale type-button flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill bg-accent px-3 text-on-primary shadow-sm"
                onClick={() => void addFriend()}
              >
                <PlusIcon size={15} />
                {messages.world.addFriend}
              </button>
            )}
            <button
              type="button"
              className="tap-scale type-button flex h-11 flex-1 items-center justify-center gap-1.5 rounded-pill border border-accent bg-surface px-3 font-semibold text-accent"
              onClick={() => setProposeOpen(true)}
            >
              <PlusIcon size={14} />
              {messages.world.invite}
            </button>
            <button
              type="button"
              aria-label={liked ? messages.social.likeHere : messages.social.likePlace}
              onClick={() => void like(false)}
              className={`tap-scale grid h-11 w-11 shrink-0 place-items-center rounded-full ${
                liked ? "bg-accent text-on-primary" : "border border-border bg-surface text-muted"
              }`}
            >
              <HeartIcon size={16} filled={liked} />
            </button>
            <button
              type="button"
              aria-label={messages.world.moreActions}
              onClick={() => setMoreOpen(true)}
              className="tap-scale grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-surface text-muted"
            >
              <MoreIcon size={16} />
            </button>
          </div>
        )}
      </div>

      <dl className="mt-5 space-y-2.5 px-5">
        {profile.profession ? (
          <div className="flex items-center gap-3 text-left">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-sunken text-muted">
              <BriefcaseIcon size={14} />
            </span>
            <dd className="type-body-sm text-ink">{profile.profession}</dd>
          </div>
        ) : null}
        {place ? (
          <div className="flex items-center gap-3 text-left">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-sunken text-muted">
              <PinIcon size={14} />
            </span>
            <dd className="type-body-sm text-ink">
              {messages.world.livesAt.replace("{place}", place)}
              {profile.zone ? <span className="text-muted"> · {profile.zone}</span> : null}
            </dd>
          </div>
        ) : null}
        {websiteLabel ? (
          <div className="flex items-center gap-3 text-left">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-sunken text-muted">
              <LinkIcon size={14} />
            </span>
            <dd className="type-body-sm truncate text-accent">{websiteLabel}</dd>
          </div>
        ) : null}
        {profile.bio ? (
          <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setBioOpen((v) => !v)}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-sunken text-muted">
              <InfoIcon size={14} />
            </span>
            <span className="type-body-sm text-ink">
              {messages.world.moreAbout.replace("{name}", profile.firstName)}
            </span>
          </button>
        ) : null}
        {bioOpen && profile.bio ? <p className="type-body-sm pl-11 leading-6 text-muted">{profile.bio}</p> : null}
      </dl>

      {profile.isSelf && profile.likeStats.likeTime ? (
        <div className="mt-5 px-4">
          <LikeCapital time={profile.likeStats.likeTime} forSelf />
        </div>
      ) : null}

      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto px-4">
        {(
          [
            ["posts", messages.social.publications, ImageIcon],
            ["events", messages.social.events, CalendarIcon],
            ["moods", messages.social.moodsTab, MessageIcon],
          ] as const
        ).map(([key, label, Icon]) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`type-caption tap-scale inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-2 font-semibold ${
                active ? "bg-accent text-on-primary" : "bg-accent-soft text-accent"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 px-4">
        {tab === "posts" ? (
          profile.posts.length === 0 ? (
            <EmptyState title={messages.social.postsTab} body={messages.home.emptyBody} />
          ) : (
            <div className="space-y-3">
              {profile.posts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onChanged={(next, meta) =>
                    setProfile((cur) =>
                      cur
                        ? {
                            ...cur,
                            posts: meta?.soleLike ? applySoleLike(cur.posts, next) : replaceFeedItem(cur.posts, next),
                          }
                        : cur,
                    )
                  }
                />
              ))}
            </div>
          )
        ) : null}
        {tab === "events" ? (
          <div className="space-y-7">
            <EventRail
              title={messages.world.eventsInterested}
              items={profile.eventsInterested ?? []}
              empty={messages.world.eventsEmpty}
            />
            <section>
              <p className="type-heading mb-3 text-ink">
                {profile.isSelf
                  ? messages.world.profileMyWishes
                  : messages.world.profileOffer.replace("{name}", profile.firstName)}
              </p>
              <WishList ownerId={profile.id} isSelf={profile.isSelf} />
            </section>
            <EventRail
              title={messages.world.eventsLinkedNamed
                .replace("{n}", String(profile.eventsLinked?.length ?? 0))
                .replace("{name}", profile.firstName)}
              items={profile.eventsLinked ?? []}
              empty={messages.world.eventsEmpty}
              isSelf={profile.isSelf}
              onToggleVisibility={(id, show) => void toggleLinkedVisibility(id, show)}
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
      <OptionsSheet
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        actions={[
          {
            key: "invite-event",
            label: messages.world.inviteJoin,
            icon: <CalendarIcon size={16} />,
            onClick: () => router.push(`/invite/${profile.id}`),
          },
          {
            key: "propose",
            label: messages.socialInvite.proposeOuting,
            icon: <SparklesIcon size={16} />,
            onClick: () => setProposeOpen(true),
          },
          {
            key: "report",
            label: messages.admin.report,
            icon: <FlagIcon size={15} />,
            danger: true,
            onClick: () => setReportOpen(true),
          },
        ]}
      />
    </div>
  );
}

function EventRail({
  title,
  items,
  empty,
  isSelf,
  onToggleVisibility,
}: {
  title: string;
  items: EventPreview[];
  empty: string;
  isSelf?: boolean;
  onToggleVisibility?: (id: string, show: boolean) => void;
}) {
  const { locale, messages } = useI18n();
  if (!items.length) {
    return (
      <section>
        <p className="type-heading mb-2 text-ink">{title}</p>
        <p className="type-caption text-muted">{empty}</p>
      </section>
    );
  }
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="type-heading min-w-0 text-ink">{title}</p>
        <Link href="/events" className="type-caption inline-flex shrink-0 items-center gap-0.5 font-semibold text-accent">
          {messages.world.seeAll}
          <ChevronRightIcon size={14} />
        </Link>
      </div>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
        {items.map((e) => (
          <article key={e.id} className="w-[17.5rem] shrink-0">
            <Link href={`/events/${e.id}`} className="tap-scale block overflow-hidden rounded-[22px] bg-surface shadow-card">
              <div className="relative h-40">
                {e.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full bg-accent/10" />
                )}
                <span className="type-caption absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 font-semibold text-ink backdrop-blur-sm">
                  {messages.world.participantsCount.replace("{n}", String(e.taken))}
                </span>
                <div className="absolute inset-x-2.5 bottom-2.5 rounded-2xl bg-white/92 p-2.5 backdrop-blur-sm">
                  <p className="type-body-sm truncate font-semibold text-ink">
                    {e.title}
                    {e.minAge ? (
                      <span className="ml-1.5 rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">
                        -{e.minAge}
                      </span>
                    ) : null}
                  </p>
                  <p className="type-caption mt-0.5 truncate text-muted">
                    {e.host.firstName} {e.host.lastName}
                    {e.city ? ` · ${e.city}` : ""}
                  </p>
                  <p className="type-caption mt-0.5 font-medium text-yellow">{formatEventWhen(e.startsAt, locale)}</p>
                </div>
              </div>
            </Link>
            {isSelf && !e.hosted && onToggleVisibility ? (
              <button
                type="button"
                onClick={() => onToggleVisibility(e.id, !e.showOnProfile)}
                className="type-caption mt-1.5 w-full text-center font-semibold text-accent"
              >
                {e.showOnProfile ? messages.world.showOnProfile : messages.world.hideOnProfile}
              </button>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
