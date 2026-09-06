import type { FeedItem, LikePlacement, MoodItem } from "./api";

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

export function releaseViewerMoodLike(mood: MoodItem): MoodItem {
  if (!mood.likedByMe && !mood.likeTime?.likedByMe) return mood;
  const active = Math.max(0, (mood.likeTime?.activeCount ?? 1) - 1);
  return {
    ...mood,
    likedByMe: false,
    likeTime: {
      ...mood.likeTime,
      totalSeconds: mood.likeTime?.totalSeconds ?? 0,
      activeCount: active,
      likedByMe: false,
      label: mood.likeTime?.label ?? "0 s",
    },
  };
}

export function applySoleMoodLike(items: MoodItem[], next: MoodItem): MoodItem[] {
  return items.map((m) => (m.id === next.id ? next : releaseViewerMoodLike(m)));
}
