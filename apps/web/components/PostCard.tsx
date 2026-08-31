"use client";

import Link from "next/link";
import { useState } from "react";
import { api, ApiError, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { LikeDialogs, likeErrorKind } from "./LikeDialogs";
import { Modal } from "./ui";

export function PostCard({
  post,
  onChanged,
}: {
  post: FeedItem;
  onChanged?: (next: FeedItem) => void;
}) {
  const { messages } = useI18n();
  const { user } = useSession();
  const [transfer, setTransfer] = useState<{ name: string } | null>(null);
  const [soon, setSoon] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const mine = user?.id === post.author.id;

  async function like(confirmTransfer = false) {
    if (mine) {
      setSoon(messages.social.likeSelf);
      return;
    }
    try {
      if (post.likedAuthor) {
        await api(`/users/${post.author.id}/like`, { method: "DELETE" });
        onChanged?.({ ...post, likedAuthor: false, authorActiveLikes: Math.max(0, post.authorActiveLikes - 1) });
        return;
      }
      await api(`/users/${post.author.id}/like`, {
        method: "POST",
        body: JSON.stringify({ confirmTransfer }),
      });
      onChanged?.({ ...post, likedAuthor: true, authorActiveLikes: post.authorActiveLikes + 1 });
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
            `/users/${post.author.id}/like/preview`,
          );
          const n = preview.wouldTransferFrom
            ? `${preview.wouldTransferFrom.firstName} ${preview.wouldTransferFrom.lastName}`
            : "…";
          setTransfer({ name: n });
        }
      }
    }
  }

  async function follow() {
    if (mine) return;
    if (post.viewerFollows) {
      await api(`/users/${post.author.id}/follow`, { method: "DELETE" });
      onChanged?.({ ...post, viewerFollows: false });
    } else {
      await api(`/users/${post.author.id}/follow`, { method: "POST" });
      onChanged?.({ ...post, viewerFollows: true });
    }
  }

  return (
    <article className="rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <Link href={`/u/${post.author.username}`} className="h-11 w-11 rounded-full bg-accent/20" />
        <div className="flex-1">
          <Link href={`/u/${post.author.username}`} className="font-semibold text-accent">
            {post.author.firstName} {post.author.lastName} {post.author.certified ? "✓" : ""}
          </Link>
          <p className="text-xs text-muted">{new Date(post.createdAt).toLocaleString()}</p>
        </div>
        {!mine ? (
          <button type="button" onClick={() => void follow()} className="text-xs font-semibold text-accent">
            {post.viewerFollows ? messages.social.following : messages.social.follow}
          </button>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-ink">{post.body}</p>
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="mt-3 h-44 w-full rounded-2xl object-cover" />
      ) : null}
      <p className="mt-3 text-xs text-muted">
        {post.commentsCount} {messages.social.comments}
        {post.zone ? ` · ${post.city} - ${post.zone}` : ""}
        {` · ${post.authorActiveLikes} likes`}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          aria-label={messages.social.likePerson}
          onClick={() => void like(false)}
          className={`grid h-10 w-10 place-items-center rounded-full ${post.likedAuthor ? "bg-accent text-white" : "bg-[var(--border)] text-muted"}`}
        >
          ♥
        </button>
        <Link
          href={`/posts/${post.id}`}
          className="grid h-10 w-10 place-items-center rounded-full bg-[var(--border)] text-muted"
          aria-label={messages.social.comments}
        >
          💬
        </Link>
      </div>
      <LikeDialogs
        transferName={transfer?.name ?? null}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void like(true)}
        onCloseBuy={() => setBuy(false)}
      />
      <Modal open={Boolean(soon)} title={messages.social.likePerson} onClose={() => setSoon(null)}>
        {soon}
      </Modal>
    </article>
  );
}
