import type { EventCard, FeedItem, MoodItem, PersonCard } from "./api";

export type MixedFeedEntry =
  | { kind: "post"; id: string; post: FeedItem }
  | { kind: "event"; id: string; event: EventCard }
  | { kind: "person"; id: string; person: PersonCard }
  | { kind: "invite"; id: string; person: PersonCard }
  | { kind: "mood"; id: string; mood: MoodItem };

type DeckKey = "mood" | "post" | "text" | "person" | "invite" | "event";

const DECK_ORDER: DeckKey[] = ["mood", "post", "text", "person", "invite", "event"];

const DECK_WEIGHT: Record<DeckKey, number> = {
  mood: 3,
  post: 3,
  event: 2,
  person: 2,
  invite: 2,
  text: 1,
};

function invitePriority(person: PersonCard): number {
  const why = person.why ?? [];
  const shared = why.find((reason) => reason.key === "shared_interests")?.count ?? 0;
  const nearby = why.some((reason) => reason.key === "nearby_available") ? 8 : 0;
  const moodWhy = why.some((reason) => reason.key === "mood") ? 6 : 0;
  const mood = person.activeMood ? 4 : 0;
  const proximity = person.distanceKm != null ? Math.max(0, 6 - person.distanceKm) : 0;
  return 10 + nearby + moodWhy + mood + shared + proximity;
}

/** Dispo à inviter (style notif) vs deck swipe — sans vider le deck. */
export function splitFeedPeople(people: PersonCard[], maxInvitees = 3) {
  if (people.length <= 1) return { invitees: [] as PersonCard[], deck: people };
  const available = people
    .filter((p) => p.presence === "AVAILABLE" || p.available)
    .slice()
    .sort((a, b) => invitePriority(b) - invitePriority(a));
  const invitees = available.slice(0, maxInvitees);
  const ids = new Set(invitees.map((p) => p.id));
  const deck = people.filter((p) => !ids.has(p.id));
  if (deck.length > 0) return { invitees, deck };
  const keep = invitees.slice(0, Math.max(1, invitees.length - 1));
  const rest = people.filter((p) => !keep.some((i) => i.id === p.id));
  return { invitees: keep, deck: rest };
}

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

function surfaceKind(deck: DeckKey): MixedFeedEntry["kind"] {
  return deck === "text" ? "post" : deck;
}

function pickDeck(keys: DeckKey[], rng: () => number): DeckKey {
  const total = keys.reduce((sum, key) => sum + DECK_WEIGHT[key], 0);
  let cursor = rng() * total;
  for (const key of keys) {
    cursor -= DECK_WEIGHT[key];
    if (cursor <= 0) return key;
  }
  return keys[keys.length - 1]!;
}

/**
 * Mélange vivant : pondération + diversité (pas de cycle 10 slots).
 * N’enchaîne pas deux mêmes kinds de surface s’il reste un autre seau.
 */
export function mixHomeFeed(
  input: {
    posts: FeedItem[];
    events: EventCard[];
    people: PersonCard[];
    invitees?: PersonCard[];
    moods: MoodItem[];
  },
  rng: () => number = Math.random,
): MixedFeedEntry[] {
  const split = input.invitees ? { invitees: input.invitees, deck: input.people } : splitFeedPeople(input.people);
  const linkedEvents = new Set(input.posts.map((p) => p.event?.id).filter(Boolean) as string[]);
  const visual = input.posts.filter((p) => p.imageUrl || (p.imageUrls && p.imageUrls.length > 0) || p.event);
  const text = input.posts.filter((p) => !p.imageUrl && !p.event);
  const decks: Record<DeckKey, MixedFeedEntry[]> = {
    post: shuffle(visual, rng).map((post) => ({ kind: "post", id: `post:${post.id}`, post })),
    text: shuffle(text, rng).map((post) => ({ kind: "post", id: `post:${post.id}`, post })),
    event: shuffle(
      input.events.filter((e) => !linkedEvents.has(e.id)),
      rng,
    ).map((event) => ({ kind: "event", id: `event:${event.id}`, event })),
    person: shuffle(split.deck, rng).map((person) => ({ kind: "person", id: `person:${person.id}`, person })),
    invite: shuffle(split.invitees, rng).map((person) => ({ kind: "invite", id: `invite:${person.id}`, person })),
    mood: shuffle(input.moods, rng).map((mood) => ({ kind: "mood", id: `mood:${mood.id}`, mood })),
  };

  const out: MixedFeedEntry[] = [];
  let last: DeckKey | null = null;
  while (true) {
    const available = DECK_ORDER.filter((key) => decks[key].length > 0);
    if (available.length === 0) break;
    const lastSurface = last ? surfaceKind(last) : null;
    const preferred = lastSurface
      ? available.filter((key) => surfaceKind(key) !== lastSurface)
      : available;
    const pool = preferred.length > 0 ? preferred : available;
    const key = pickDeck(pool, rng);
    const row = decks[key].shift();
    if (!row) break;
    out.push(row);
    last = key;
  }
  return out;
}
