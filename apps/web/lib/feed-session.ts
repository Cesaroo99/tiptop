import type { EventCard, FeedItem, MoodItem, PersonCard } from "./api";
import type { MixedFeedEntry } from "./feed-mix";

export type FeedCache = {
  items: FeedItem[];
  events: EventCard[];
  people: PersonCard[];
  reels: MoodItem[];
  moods: MoodItem[];
  order: Array<{ kind: MixedFeedEntry["kind"]; id: string }>;
  nextCursor: string | null;
  hasMore: boolean;
  scrollTop: number;
  at: number;
};

const KEY = "tiptop.home.feed.v1";
const TTL_MS = 30 * 60 * 1000;
let memory: FeedCache | null = null;

export function readFeedCache(): FeedCache | null {
  if (memory && Date.now() - memory.at < TTL_MS) return memory;
  if (typeof sessionStorage === "undefined") return null;
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? "") as FeedCache;
    if (!parsed?.items || Date.now() - parsed.at > TTL_MS) return null;
    memory = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function writeFeedCache(cache: FeedCache) {
  memory = cache;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
}

export function feedScrollRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.getElementById("tiptop-scroll");
}

export function captureFeedScroll(): number {
  return feedScrollRoot()?.scrollTop ?? 0;
}

export function restoreFeedScroll(top: number) {
  const root = feedScrollRoot();
  if (!root || !Number.isFinite(top)) return;
  requestAnimationFrame(() => {
    root.scrollTop = top;
  });
}

export function rebuildStream(
  cache: FeedCache,
): MixedFeedEntry[] {
  const posts = new Map(cache.items.map((p) => [`post:${p.id}`, p]));
  const events = new Map(cache.events.map((e) => [`event:${e.id}`, e]));
  const people = new Map(cache.people.map((p) => [`person:${p.id}`, p]));
  const moods = new Map(cache.reels.map((m) => [`mood:${m.id}`, m]));
  const out: MixedFeedEntry[] = [];
  for (const row of cache.order) {
    if (row.kind === "post") {
      const post = posts.get(row.id);
      if (post) out.push({ kind: "post", id: row.id, post });
    } else if (row.kind === "event") {
      const event = events.get(row.id);
      if (event) out.push({ kind: "event", id: row.id, event });
    } else if (row.kind === "person") {
      const person = people.get(row.id);
      if (person) out.push({ kind: "person", id: row.id, person });
    } else {
      const mood = moods.get(row.id);
      if (mood) out.push({ kind: "mood", id: row.id, mood });
    }
  }
  return out;
}
