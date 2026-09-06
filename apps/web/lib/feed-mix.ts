import type { EventCard, FeedItem, MoodItem, PersonCard } from "./api";

export type MixedFeedEntry =
  | { kind: "post"; id: string; post: FeedItem }
  | { kind: "event"; id: string; event: EventCard }
  | { kind: "person"; id: string; person: PersonCard }
  | { kind: "mood"; id: string; mood: MoodItem };

function shuffle<T>(items: T[], rng: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

/** Alterne posts, events, personnes et moods pour que le fil ne soit jamais monotone. */
export function mixHomeFeed(
  input: {
    posts: FeedItem[];
    events: EventCard[];
    people: PersonCard[];
    moods: MoodItem[];
  },
  rng: () => number = Math.random,
): MixedFeedEntry[] {
  const linkedEvents = new Set(input.posts.map((p) => p.event?.id).filter(Boolean) as string[]);
  const visual = input.posts.filter((p) => p.imageUrl || p.event);
  const text = input.posts.filter((p) => !p.imageUrl && !p.event);
  const decks: Record<string, MixedFeedEntry[]> = {
    post: shuffle(visual, rng).map((post) => ({ kind: "post", id: `post:${post.id}`, post })),
    text: shuffle(text, rng).map((post) => ({ kind: "post", id: `post:${post.id}`, post })),
    event: shuffle(
      input.events.filter((e) => !linkedEvents.has(e.id)),
      rng,
    ).map((event) => ({ kind: "event", id: `event:${event.id}`, event })),
    person: shuffle(input.people, rng).map((person) => ({ kind: "person", id: `person:${person.id}`, person })),
    mood: shuffle(input.moods, rng).map((mood) => ({ kind: "mood", id: `mood:${mood.id}`, mood })),
  };

  const pattern = ["mood", "post", "person", "event", "post", "mood", "text", "person", "event", "post"] as const;
  const out: MixedFeedEntry[] = [];
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const key of pattern) {
      const row = decks[key]?.shift();
      if (!row) continue;
      out.push(row);
      progressed = true;
    }
  }
  return out;
}
