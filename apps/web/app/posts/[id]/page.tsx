"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PostCard } from "@/components/PostCard";
import { EmptyState, ErrorBanner, Skeleton, TextInput } from "@/components/ui";
import { api, type CommentItem, type FeedItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function PostPage() {
  return (
    <AppShell>
      <Thread />
    </AppShell>
  );
}

function Thread() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const [post, setPost] = useState<FeedItem | null>(null);
  const [comments, setComments] = useState<CommentItem[] | null>(null);
  const [text, setText] = useState("");
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
      body: JSON.stringify({ body: text }),
    });
    setComments((cur) => [...(cur ?? []), created]);
    setText("");
    if (post) setPost({ ...post, commentsCount: post.commentsCount + 1 });
  }

  return (
    <div className="space-y-4 px-4 py-4">
      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {!post && !error ? <Skeleton className="h-48" /> : null}
      {post ? <PostCard post={post} onChanged={setPost} /> : null}
      <h2 className="text-sm font-semibold">{messages.social.comments}</h2>
      {comments && comments.length === 0 ? (
        <EmptyState title={messages.social.comments} body={messages.social.emptyComments} />
      ) : null}
      {comments?.map((c) => (
        <div key={c.id} className="rounded-2xl bg-surface px-4 py-3 shadow-card">
          <p className="text-sm font-semibold text-accent">
            {c.author.firstName} {c.author.lastName}
          </p>
          <p className="text-sm text-ink">{c.body}</p>
        </div>
      ))}
      <form onSubmit={send} className="flex gap-2 pb-4">
        <TextInput
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={messages.social.addComment}
        />
        <button type="submit" className="rounded-pill bg-accent px-4 font-semibold text-white">
          OK
        </button>
      </form>
    </div>
  );
}
