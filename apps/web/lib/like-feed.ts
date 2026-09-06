import type { FeedItem, LikePlacement } from "./api";

/** Like unique : après chargement, seul le placement courant est actif. */
export function viewerLikeActive(
  placement: Pick<LikePlacement, "targetType" | "targetId"> | null | undefined,
  type: LikePlacement["targetType"],
  id: string,
  fallback = false,
  ready = false,
): boolean {
  if (!ready) return fallback;
  if (!placement) return false;
  return placement.targetType === type && placement.targetId === id;
}

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
