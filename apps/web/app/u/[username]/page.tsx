"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PresencePicker } from "@/components/PresencePicker";
import {
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
  SlashIcon,
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
import { BackButton, EmptyState, ErrorBanner, Modal, Skeleton } from "@/components/ui";
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
  wanted?: boolean;
  showOnProfile?: boolean;
  host: { firstName: string; lastName: string; avatarUrl: string | null };
};

type EventPane = "interested" | "linked" | "wishes";

function defaultWantedWhen() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(18, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
    <AppShell chrome="nav">
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
  const [eventPane, setEventPane] = useState<EventPane>("interested");
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
      <div className="relative h-24 bg-gradient-to-br from-accent/20 via-yellow/10 to-transparent">
        {profile.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <BackButton className="absolute left-2 top-2 z-10 bg-black/40 text-white hover:bg-black/55" />
        {profile.isSelf ? (
          <Link
            href="/account"
            className="tap-scale type-caption absolute right-2 top-2 z-10 rounded-pill bg-black/40 px-3 py-2 font-semibold text-white hover:bg-black/55"
          >
            {messages.account.edit}
          </Link>
        ) : null}
      </div>
      <div className="-mt-10 px-4 text-center">
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[var(--bg)]">
          <Avatar
            src={profile.avatarUrl}
            firstName={profile.firstName}
            lastName={profile.lastName}
            size={88}
            online={presence === "AVAILABLE"}
          />
        </span>
        <h1 className="type-h2 mt-2 flex items-center justify-center gap-1.5 text-ink">
          {profile.firstName} {profile.lastName}
          {profile.certified ? <CertifiedMark /> : null}
        </h1>
        {profile.profession ? <p className="type-body-sm mt-0.5 text-muted">{profile.profession}</p> : null}

        {profile.isSelf ? (
          <div className="mt-3 space-y-2">
            <p className="type-caption font-semibold text-muted">{messages.account.status}</p>
            <PresencePicker value={presence} busy={statusBusy} onChange={(k) => void setMyPresence(k)} />
            <Link href="/account" className="tap-scale type-button inline-flex rounded-pill bg-accent px-4 py-2 text-on-primary">
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
                {messages.world.askFriend}
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

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4">
        {place ? (
          <span className="type-caption inline-flex items-center gap-1 text-muted">
            <PinIcon size={12} />
            {place}
            {profile.zone ? ` · ${profile.zone}` : ""}
          </span>
        ) : null}
        {websiteLabel ? (
          <span className="type-caption inline-flex items-center gap-1 truncate text-accent">
            <LinkIcon size={12} />
            {websiteLabel}
          </span>
        ) : null}
        {profile.bio ? (
          <button type="button" className="type-caption inline-flex items-center gap-1 font-semibold text-ink" onClick={() => setBioOpen((v) => !v)}>
            <InfoIcon size={12} />
            {messages.world.moreAbout.replace("{name}", profile.firstName)}
          </button>
        ) : null}
      </div>
      {bioOpen && profile.bio ? <p className="type-caption px-5 pt-1 leading-5 text-muted">{profile.bio}</p> : null}

      <div className="sticky top-0 z-20 mt-4 bg-[color-mix(in_srgb,var(--bg)_94%,transparent)] px-4 pb-2 pt-1 backdrop-blur-md">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
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
        {tab === "events" ? (
          <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-2xl bg-surface-sunken p-1">
            {(
              [
                ["interested", messages.world.eventsPaneInterested],
                ["linked", messages.world.eventsPaneLinked],
                ["wishes", messages.world.eventsPaneWishes],
              ] as const
            ).map(([key, label]) => {
              const active = eventPane === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEventPane(key)}
                  className={`type-caption tap-scale rounded-xl py-2 font-semibold ${
                    active ? "bg-surface text-ink shadow-sm" : "text-muted"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="mt-3 px-4">
        {tab === "posts" ? (
          <div className="space-y-3">
            {profile.isSelf && profile.likeStats.likeTime ? <LikeCapital time={profile.likeStats.likeTime} forSelf /> : null}
            {profile.posts.length === 0 ? (
              <EmptyState title={messages.social.postsTab} body={messages.home.emptyBody} />
            ) : (
              profile.posts.map((p) => (
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
              ))
            )}
          </div>
        ) : null}
        {tab === "events" && eventPane === "interested" ? (
          <div className="space-y-3">
            {profile.isSelf ? (
              <WantedEventForm
                defaultCity={profile.city ?? "Yaoundé"}
                onCreated={(item) =>
                  setProfile((cur) =>
                    cur ? { ...cur, eventsInterested: [item, ...(cur.eventsInterested ?? [])] } : cur,
                  )
                }
              />
            ) : null}
            <EventRail
              items={profile.eventsInterested ?? []}
              empty={profile.isSelf ? messages.world.wantedEmptySelf : messages.world.wantedEmpty}
              ownerFirstName={profile.firstName}
              isSelf={profile.isSelf}
            />
          </div>
        ) : null}
        {tab === "events" && eventPane === "linked" ? (
          <EventRail
            items={profile.eventsLinked ?? []}
            empty={messages.world.eventsEmpty}
            ownerFirstName={profile.firstName}
            isSelf={profile.isSelf}
            onToggleVisibility={(id, show) => void toggleLinkedVisibility(id, show)}
          />
        ) : null}
        {tab === "events" && eventPane === "wishes" ? (
          <section>
            <p className="type-heading mb-3 text-ink">
              {profile.isSelf
                ? messages.world.profileMyWishes
                : messages.world.profileOffer.replace("{name}", profile.firstName)}
            </p>
            <WishList ownerId={profile.id} isSelf={profile.isSelf} />
          </section>
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
            key: "block",
            label: messages.social.blockUser,
            icon: <SlashIcon size={15} />,
            danger: true,
            onClick: async () => {
              await api(`/users/${profile.id}/block`, { method: "POST" });
              router.back();
            },
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

function hostLine(e: EventPreview, ownerFirstName: string, isSelf: boolean, messages: ReturnType<typeof useI18n>["messages"]) {
  if (e.wanted) {
    return isSelf ? messages.world.myWantedEvent : messages.world.theirWantedEvent.replace("{name}", ownerFirstName);
  }
  return messages.world.organizedBy.replace("{name}", `${e.host.firstName} ${e.host.lastName}`.trim());
}

function EventRail({
  items,
  empty,
  ownerFirstName,
  isSelf,
  onToggleVisibility,
}: {
  items: EventPreview[];
  empty: string;
  ownerFirstName: string;
  isSelf?: boolean;
  onToggleVisibility?: (id: string, show: boolean) => void;
}) {
  const { locale, messages } = useI18n();
  if (!items.length) {
    return <p className="type-caption text-muted">{empty}</p>;
  }
  return (
    <section className="space-y-3">
      <div className="flex justify-end">
        <Link href="/events" className="type-caption inline-flex items-center gap-0.5 font-semibold text-accent">
          {messages.world.seeAll}
          <ChevronRightIcon size={14} />
        </Link>
      </div>
      {items.map((e) => (
        <article key={e.id}>
          <Link href={`/events/${e.id}`} className="tap-scale flex gap-3 overflow-hidden rounded-card bg-surface p-2.5 shadow-card">
            <span className="relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-accent/15 to-yellow/15">
              {e.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="grid h-full place-items-center text-accent">
                  <SparklesIcon size={22} />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1 py-0.5">
              <p className="type-heading truncate text-ink">
                {e.title}
                {e.minAge ? (
                  <span className="ml-1.5 align-middle rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-bold text-danger">
                    -{e.minAge}
                  </span>
                ) : null}
              </p>
              <p className="type-caption mt-0.5 font-medium text-accent">{hostLine(e, ownerFirstName, Boolean(isSelf), messages)}</p>
              <p className="type-caption mt-0.5 truncate text-muted">
                {formatEventWhen(e.startsAt, locale)}
                {e.city ? ` · ${e.city}` : ""}
              </p>
              <p className="type-caption mt-0.5 text-muted">
                {e.wanted
                  ? isSelf
                    ? messages.world.myWantedEvent
                    : messages.world.theirWantedEvent.replace("{name}", ownerFirstName)
                  : messages.world.participantsCount.replace("{n}", String(e.taken))}
              </p>
            </span>
          </Link>
          {isSelf && !e.hosted && !e.wanted && onToggleVisibility ? (
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
    </section>
  );
}

function WantedEventForm({
  defaultCity,
  onCreated,
}: {
  defaultCity: string;
  onCreated: (item: EventPreview) => void;
}) {
  const { messages } = useI18n();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState(defaultWantedWhen);
  const [city, setCity] = useState(defaultCity);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await api<EventPreview & { host?: EventPreview["host"]; taken?: number }>(
        "/events",
        {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            city: city.trim() || defaultCity,
            startsAt: new Date(startsAt).toISOString(),
            wanted: true,
          }),
        },
      );
      onCreated({
        id: created.id,
        title: created.title,
        imageUrl: created.imageUrl ?? null,
        city: created.city,
        zone: created.zone ?? null,
        startsAt: created.startsAt,
        minAge: created.minAge ?? null,
        taken: created.taken ?? 1,
        hosted: true,
        wanted: true,
        showOnProfile: true,
        host: created.host ?? { firstName: "", lastName: "", avatarUrl: null },
      });
      setTitle("");
      setStartsAt(defaultWantedWhen());
      setOpen(false);
    } catch {
      setError(messages.common.error);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap-scale type-button flex w-full items-center justify-center gap-2 rounded-pill border-2 border-dashed border-accent/40 bg-accent-soft py-3 text-accent"
      >
        <PlusIcon size={16} />
        {messages.world.createWanted}
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3 rounded-card bg-surface p-4 shadow-card">
      <p className="type-caption leading-5 text-muted">{messages.world.createWantedHint}</p>
      <input
        required
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={messages.world.wantedTitlePlaceholder}
        className="type-body w-full rounded-xl border border-border bg-surface px-4 py-3 text-ink"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="type-caption mb-1 block font-semibold text-muted">{messages.world.wantedDate}</span>
          <input
            required
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="type-caption w-full rounded-xl border border-border bg-surface px-2 py-2.5 text-ink"
          />
        </label>
        <label className="block">
          <span className="type-caption mb-1 block font-semibold text-muted">{messages.world.wantedCity}</span>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="type-caption w-full rounded-xl border border-border bg-surface px-2 py-2.5 text-ink"
          />
        </label>
      </div>
      {error ? <p className="type-caption text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="tap-scale type-button flex-1 rounded-pill border border-border bg-surface py-2.5 text-ink"
        >
          {messages.common.cancel}
        </button>
        <button
          type="submit"
          disabled={busy || !title.trim()}
          className="tap-scale type-button flex-1 rounded-pill bg-accent py-2.5 text-on-primary disabled:opacity-45"
        >
          {messages.world.wantedSave}
        </button>
      </div>
    </form>
  );
}
