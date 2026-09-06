/** Pondérations du Home — remplaçables sans changer les signaux. */

export const FEED_RANK_WEIGHTS = {
  follow: 40,
  friend: 28,
  city: 16,
  recencyMax: 24,
  recencyHalfLifeHours: 18,
  lifePerSecond: 0.002,
  lifeCap: 22,
  comment: 1.5,
  commentCap: 10,
} as const;

export type FeedRankSignals = {
  isFollowed: boolean;
  isFriend: boolean;
  sameCity: boolean;
  createdAt: Date | string;
  now?: Date | string;
  lifeSeconds: number;
  commentCount: number;
  blocked?: boolean;
};

export type FeedHint = "followed" | "local" | "alive";

export function feedItemScore(signals: FeedRankSignals): number {
  if (signals.blocked) return Number.NEGATIVE_INFINITY;
  const now = signals.now ? new Date(signals.now).getTime() : Date.now();
  const created = new Date(signals.createdAt).getTime();
  const hours = Math.max(0, (now - created) / 3_600_000);
  const recency =
    FEED_RANK_WEIGHTS.recencyMax * Math.exp(-hours / FEED_RANK_WEIGHTS.recencyHalfLifeHours);
  const life = Math.min(FEED_RANK_WEIGHTS.lifeCap, Math.max(0, signals.lifeSeconds) * FEED_RANK_WEIGHTS.lifePerSecond);
  const comments = Math.min(FEED_RANK_WEIGHTS.commentCap, Math.max(0, signals.commentCount) * FEED_RANK_WEIGHTS.comment);
  return (
    (signals.isFollowed ? FEED_RANK_WEIGHTS.follow : 0) +
    (signals.isFriend ? FEED_RANK_WEIGHTS.friend : 0) +
    (signals.sameCity ? FEED_RANK_WEIGHTS.city : 0) +
    recency +
    life +
    comments
  );
}

/** Un seul hint, uniquement s’il est vrai. Priorité : suivi > vie longue > ville. */
export function feedHint(signals: FeedRankSignals): FeedHint | null {
  if (signals.blocked) return null;
  if (signals.isFollowed) return "followed";
  if (signals.lifeSeconds >= 3600) return "alive";
  if (signals.sameCity) return "local";
  return null;
}

export type DiscoveryWhyKey = "shared_interests" | "nearby_available" | "mood";

export function discoveryWhy(input: {
  sharedInterestCount: number;
  nearbyAvailable: boolean;
  moodAffinity: boolean;
}): Array<{ key: DiscoveryWhyKey; count?: number }> {
  const why: Array<{ key: DiscoveryWhyKey; count?: number }> = [];
  if (input.sharedInterestCount > 0) {
    why.push({ key: "shared_interests", count: input.sharedInterestCount });
  }
  if (input.nearbyAvailable) why.push({ key: "nearby_available" });
  if (input.moodAffinity) why.push({ key: "mood" });
  return why;
}

/** Une seule preuve sociale à montrer — amis d’abord, sinon réseau. */
export function eventSocialProof(input: { friendsGoing: number; networkGoing: number }): "friends" | "network" | null {
  if (input.friendsGoing > 0) return "friends";
  if (input.networkGoing > 0) return "network";
  return null;
}
