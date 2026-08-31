"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { LikeDialogs, likeErrorKind } from "@/components/LikeDialogs";
import { PostCard } from "@/components/PostCard";
import { EmptyState, ErrorBanner, Modal, PrimaryButton, Skeleton } from "@/components/ui";
import { api, ApiError, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

type Profile = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profession: string | null;
  bio: string | null;
  city: string | null;
  zone: string | null;
  website: string | null;
  availability: string;
  isSelf: boolean;
  following: boolean;
  followersCount: number;
  followingCount: number;
  likedByMe: boolean;
  likeStats: { active: number; perHour: number; perDay: number; perMonth: number };
  posts: FeedItem[];
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
  const { user } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [soon, setSoon] = useState<string | null>(null);
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);

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

  return (
    <div className="pb-8">
      <div className="h-28 bg-gradient-to-r from-accent/30 to-yellow/20" />
      <div className="-mt-10 px-4">
        <div className="mx-auto h-20 w-20 rounded-full bg-accent/30 ring-4 ring-[var(--bg)]" />
        <h1 className="mt-3 text-xl font-bold text-ink">
          {profile.firstName} {profile.lastName} {profile.certified ? "✓" : ""}
        </h1>
        <p className="text-sm text-muted">@{profile.username}</p>
        {profile.profession ? <p className="mt-1 text-sm text-muted">{profile.profession}</p> : null}
        {profile.city ? (
          <p className="text-sm text-muted">
            {messages.chat.livesIn.replace("{place}", `${profile.city}${profile.zone ? ` - ${profile.zone}` : ""}`)}
          </p>
        ) : null}
        {profile.availability === "AVAILABLE" ? (
          <p className="mt-1 text-xs font-semibold text-accent">{messages.world.available}</p>
        ) : null}
        <p className="mt-2 text-xs text-muted">
          {profile.followersCount} · {profile.followingCount} · {profile.likeStats.active} likes
        </p>
        {!profile.isSelf ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <PrimaryButton className="!w-auto px-5" onClick={() => void toggleFollow()}>
              {profile.following ? messages.social.unfollow : messages.social.follow}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => void like(false)}
              className={`rounded-pill px-5 py-3 font-semibold ${profile.likedByMe ? "bg-accent text-white" : "bg-[var(--border)]"}`}
            >
              ♥ {messages.social.likePerson}
            </button>
            <button
              type="button"
              className="rounded-pill bg-[var(--border)] px-5 py-3"
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
              {messages.chat.messageCta}
            </button>
            <Link href={`/invite/${profile.id}`} className="rounded-pill bg-[var(--border)] px-5 py-3">
              + {messages.world.invite}
            </Link>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-muted">@{user?.username}</p>
            <Link href="/zone" className="text-sm font-semibold text-accent">
              {messages.world.goAvailable} · {messages.world.zoneTitle}
            </Link>
          </div>
        )}
      </div>
      <div className="mt-6 px-4">
        <p className="mb-3 font-semibold">{messages.social.postsTab}</p>
        {profile.posts.length === 0 ? (
          <EmptyState title={messages.social.postsTab} body={messages.home.emptyBody} />
        ) : (
          <div className="space-y-3">
            {profile.posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
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
    </div>
  );
}
