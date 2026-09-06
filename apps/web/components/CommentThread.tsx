"use client";

import { formatLikeDurationShort, type LikeDurationLocale } from "@tiptop/domain";
import { useState } from "react";
import { Avatar } from "./Avatar";
import { HeartIcon } from "./Icons";
import { LikeDialogs, likeErrorKind } from "./LikeDialogs";
import { useLiveLikeSeconds } from "./LikeTimeBadge";
import { api, ApiError, type CommentItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { viewerLikeActive } from "@/lib/like-feed";
import { useLikePlacement } from "@/lib/like-placement";

function groupComments(items: CommentItem[]) {
  const roots: CommentItem[] = [];
  const children = new Map<string, CommentItem[]>();
  for (const c of items) {
    if (c.parentId) {
      const list = children.get(c.parentId) ?? [];
      list.push(c);
      children.set(c.parentId, list);
    } else {
      roots.push(c);
    }
  }
  return { roots, children };
}

export function CommentThread({
  items,
  onChange,
  onReply,
}: {
  items: CommentItem[];
  onChange: (next: CommentItem) => void;
  onReply: (comment: CommentItem) => void;
}) {
  const { roots, children } = groupComments(items);
  return (
    <div className="space-y-1">
      {roots.map((c) => (
        <CommentRow key={c.id} comment={c} replies={children.get(c.id) ?? []} onChange={onChange} onReply={onReply} />
      ))}
    </div>
  );
}

function CommentRow({
  comment,
  replies,
  onChange,
  onReply,
  nested = false,
}: {
  comment: CommentItem;
  replies: CommentItem[];
  onChange: (next: CommentItem) => void;
  onReply: (comment: CommentItem) => void;
  nested?: boolean;
}) {
  const { messages } = useI18n();
  return (
    <div className={nested ? "ml-10" : ""}>
      <div className="flex gap-2.5 py-1.5">
        <Avatar src={comment.author.avatarUrl} firstName={comment.author.firstName} lastName={comment.author.lastName} size={nested ? 28 : 34} />
        <div className="min-w-0 flex-1">
          <p className="type-body-sm text-ink">
            <span className="font-semibold">{comment.author.firstName} {comment.author.lastName}</span>{" "}
            {comment.body}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <CommentLike comment={comment} onChange={onChange} />
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="type-caption font-semibold text-muted"
            >
              {messages.social.reply}
            </button>
          </div>
        </div>
      </div>
      {replies.map((r) => (
        <CommentRow key={r.id} comment={r} replies={[]} onChange={onChange} onReply={onReply} nested />
      ))}
    </div>
  );
}

function CommentLike({ comment, onChange }: { comment: CommentItem; onChange: (next: CommentItem) => void }) {
  const { messages, locale } = useI18n();
  const { placement, ready, refresh } = useLikePlacement();
  const [transfer, setTransfer] = useState<string | null>(null);
  const [buy, setBuy] = useState(false);
  const [loadedAt, setLoadedAt] = useState(() => Date.now());
  const loc: LikeDurationLocale = locale === "en" ? "en" : "fr";
  const liked = viewerLikeActive(
    placement,
    "comment",
    comment.id,
    comment.likeTime?.likedByMe ?? comment.likedByMe ?? false,
    ready,
  );
  const live = useLiveLikeSeconds(comment.likeTime, loadedAt);
  const extra = Math.max(0, live - (comment.likeTime?.totalSeconds ?? 0));
  const label = formatLikeDurationShort((comment.likeTime?.totalSeconds ?? 0) + extra, loc);

  async function like(confirmTransfer = false) {
    try {
      if (liked) {
        await api("/likes", { method: "DELETE", body: JSON.stringify({ targetType: "comment", targetId: comment.id }) });
        onChange({
          ...comment,
          likedByMe: false,
          likeTime: comment.likeTime
            ? { ...comment.likeTime, likedByMe: false, activeCount: Math.max(0, comment.likeTime.activeCount - 1) }
            : undefined,
        });
        setLoadedAt(Date.now());
        await refresh();
        return;
      }
      await api("/likes", {
        method: "POST",
        body: JSON.stringify({ targetType: "comment", targetId: comment.id, confirmTransfer }),
      });
      onChange({
        ...comment,
        likedByMe: true,
        likeTime: comment.likeTime
          ? { ...comment.likeTime, likedByMe: true, activeCount: comment.likeTime.activeCount + 1 }
          : { totalSeconds: 0, activeCount: 1, likedByMe: true, label: "0 s" },
      });
      setLoadedAt(Date.now());
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
        if (kind === "transfer") setTransfer(messages.social.transferGeneric);
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void like(false)}
        aria-label={liked ? messages.social.likeHere : messages.social.likePlace}
        className={`tap-scale inline-flex items-center gap-1 type-caption font-semibold tabular-nums ${liked ? "text-accent" : "text-muted"}`}
      >
        <HeartIcon size={13} filled={liked} />
        {label}
      </button>
      <LikeDialogs
        transferName={transfer}
        buyOpen={buy}
        onCloseTransfer={() => setTransfer(null)}
        onConfirmTransfer={() => void like(true)}
        onCloseBuy={() => setBuy(false)}
      />
    </>
  );
}
