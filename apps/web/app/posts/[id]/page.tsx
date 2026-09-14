"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CommentThread } from "@/components/CommentThread";
import { PostCard } from "@/components/PostCard";
import { EmptyState, ErrorBanner, ScreenHeader, Skeleton, TextInput } from "@/components/ui";
import { api, type CommentItem, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useLikePlacement } from "@/lib/like-placement";

export default function PostPage() {
  return (
    <AppShell chrome="nav">
      <Thread />
    </AppShell>
  );
}

function Thread() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const { refresh: refreshPlacement } = useLikePlacement();
  const [post, setPost] = useState<FeedItem | null>(null);
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const [p, c] = await Promise.all([
        api<FeedItem>(`/posts/${id}`),
        api<{ items: CommentItem[] }>(`/posts/${id}/comments`),
      ]);
      setPost(p);
      setComments(c.items);
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const created = await api<CommentItem>(`/posts/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ body: text, parentId: replyTo?.id }),
    });
    setComments((cur) => [...(cur ?? []), created]);
    setText("");
    setReplyTo(null);
    if (post) setPost({ ...post, commentsCount: post.commentsCount + 1 });
    await refreshPlacement();
  }

  return (
    <div>
      <ScreenHeader title={messages.social.publications} onBack={() => router.back()} />
      <div className="space-y-4 px-4 pb-4">
      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {!post && !error ? <Skeleton className="h-48" /> : null}
      {post ? <PostCard post={post} onChanged={setPost} /> : null}
      <h2 className="text-sm font-semibold">{messages.social.comments}</h2>
      {comments && comments.length === 0 ? (
        <EmptyState title={messages.social.comments} body={messages.social.emptyComments} />
      ) : null}
      {comments && comments.length > 0 ? (
        <div className="rounded-card bg-surface px-3 py-2 shadow-card">
          <CommentThread
            items={comments}
            onChange={(next) => setComments((cur) => (cur ?? []).map((c) => (c.id === next.id ? next : c)))}
            onReply={setReplyTo}
          />
        </div>
      ) : null}
      {replyTo ? (
        <p className="type-caption text-muted">{messages.social.replyTo.replace("{name}", replyTo.author.firstName)}</p>
      ) : null}
      <form onSubmit={send} className="flex gap-2 pb-4">
        <TextInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            replyTo
              ? messages.social.replyTo.replace("{name}", replyTo.author.firstName)
              : messages.social.addComment
          }
        />
        <button type="submit" className="rounded-pill bg-accent px-4 font-semibold text-on-primary">
          OK
        </button>
      </form>
      </div>
    </div>
  );
}
