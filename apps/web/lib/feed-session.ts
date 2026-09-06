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
  lastVisibleId?: string | null;
  at: number;
};

const KEY = "tiptop.home.feed.v2";
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

export function clearFeedCache() {
  memory = null;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
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
  restoreFeedAnchor(top, null);
}

export function captureFeedAnchor(): { scrollTop: number; lastVisibleId: string | null } {
  const root = feedScrollRoot();
  const scrollTop = root?.scrollTop ?? 0;
  if (!root) return { scrollTop, lastVisibleId: null };
  const nodes = [...root.querySelectorAll<HTMLElement>("[data-feed-key]")];
  const mid = root.getBoundingClientRect().top + 24;
  let lastVisibleId: string | null = null;
  for (const node of nodes) {
    if (node.getBoundingClientRect().top <= mid + 8) {
      lastVisibleId = node.dataset.feedKey ?? null;
    } else {
      break;
    }
  }
  return { scrollTop, lastVisibleId };
}

export function restoreFeedAnchor(scrollTop: number, lastVisibleId?: string | null) {
  const root = feedScrollRoot();
  if (!root) return;
  requestAnimationFrame(() => {
    if (lastVisibleId) {
      const escaped = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(lastVisibleId) : lastVisibleId;
      const el = root.querySelector<HTMLElement>(`[data-feed-key="${escaped}"]`);
      if (el) {
        root.scrollTop = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop;
        return;
      }
    }
    if (Number.isFinite(scrollTop)) root.scrollTop = scrollTop;
  });
}

export function leftoverFeedEntries(
  stream: MixedFeedEntry[],
  extras: { events: EventCard[]; people: PersonCard[]; invitees?: PersonCard[]; moods: MoodItem[] },
): MixedFeedEntry[] {
  const seen = new Set(stream.map((row) => row.id));
  const seenPeople = new Set(
    stream.flatMap((row) => (row.kind === "person" || row.kind === "invite" ? [row.person.id] : [])),
  );
  const out: MixedFeedEntry[] = [];
  for (const event of extras.events) {
    const id = `event:${event.id}`;
    if (!seen.has(id)) out.push({ kind: "event", id, event });
  }
  for (const person of extras.invitees ?? []) {
    const id = `invite:${person.id}`;
    if (!seen.has(id) && !seenPeople.has(person.id)) {
      out.push({ kind: "invite", id, person });
      seenPeople.add(person.id);
    }
  }
  for (const person of extras.people) {
    const id = `person:${person.id}`;
    if (!seen.has(id) && !seenPeople.has(person.id)) out.push({ kind: "person", id, person });
  }
  for (const mood of extras.moods) {
    const id = `mood:${mood.id}`;
    if (!seen.has(id)) out.push({ kind: "mood", id, mood });
  }
  return out;
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
    } else if (row.kind === "invite") {
      const rawId = row.id.startsWith("invite:") ? row.id.slice("invite:".length) : row.id;
      const person = people.get(`person:${rawId}`) ?? [...people.values()].find((p) => p.id === rawId);
      if (person) out.push({ kind: "invite", id: row.id, person });
    } else {
      const mood = moods.get(row.id);
      if (mood) out.push({ kind: "mood", id: row.id, mood });
    }
  }
  return out;
}
