import type { FeedItem } from "./api";

export function releaseViewerLike(post: FeedItem): FeedItem {
  if (!post.likedByMe && !post.likeTime?.likedByMe) return post;
  const active = Math.max(0, (post.likeTime?.activeCount ?? 1) - 1);
  return {
    ...post,
    likedByMe: false,
    likeTime: {
      ...post.likeTime,
      totalSeconds: post.likeTime?.totalSeconds ?? 0,
      activeCount: active,
      likedByMe: false,
      label: post.likeTime?.label ?? "0 s",
    },
  };
}

/** Un like unique : poser ici retire le like des autres cartes du fil. */
export function applySoleLike(items: FeedItem[], next: FeedItem): FeedItem[] {
  return items.map((p) => (p.id === next.id ? next : releaseViewerLike(p)));
}

export function replaceFeedItem(items: FeedItem[], next: FeedItem): FeedItem[] {
  return items.map((p) => (p.id === next.id ? next : p));
}
