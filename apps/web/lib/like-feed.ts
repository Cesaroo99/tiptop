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

/** Aligne une carte sur le like unique courant — décrémente vraiment activeCount. */
export function applyPlacementToPost(
  post: FeedItem,
  placement: Pick<LikePlacement, "targetType" | "targetId"> | null | undefined,
): FeedItem {
  const mine = placement?.targetType === "post" && placement.targetId === post.id;
  if (mine) {
    if (post.likedByMe && post.likeTime?.likedByMe) return post;
    return {
      ...post,
      likedByMe: true,
      likeTime: post.likeTime ? { ...post.likeTime, likedByMe: true } : post.likeTime,
    };
  }
  return releaseViewerLike(post);
}

export function applyPlacementToMood(
  mood: MoodItem,
  placement: Pick<LikePlacement, "targetType" | "targetId"> | null | undefined,
): MoodItem {
  const mine = placement?.targetType === "mood" && placement.targetId === mood.id;
  if (mine) {
    if (mood.likedByMe && mood.likeTime?.likedByMe) return mood;
    return {
      ...mood,
      likedByMe: true,
      likeTime: mood.likeTime ? { ...mood.likeTime, likedByMe: true } : mood.likeTime,
    };
  }
  return releaseViewerMoodLike(mood);
}

/** Affichage : si mon like n’est plus ici, le décompte ne doit plus avancer. */
export function viewerAwareLikeTime<T extends { likedByMe?: boolean; activeCount: number }>(
  time: T | null | undefined,
  likedByViewer: boolean,
): T | null | undefined {
  if (!time || likedByViewer) return time;
  if (!time.likedByMe) return time;
  return { ...time, likedByMe: false, activeCount: Math.max(0, time.activeCount - 1) };
}
