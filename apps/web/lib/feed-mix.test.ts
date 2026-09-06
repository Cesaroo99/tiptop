import { describe, expect, it } from "vitest";
import { MAX_HOME_FEED_MOODS, mixHomeFeed, splitFeedPeople } from "./feed-mix";
import type { EventCard, FeedItem, MoodItem, PersonCard } from "./api";

function post(id: string, extra: Partial<FeedItem> = {}): FeedItem {
  return {
    id,
    body: `post ${id}`,
    imageUrl: extra.imageUrl ?? null,
    city: "Yaoundé",
    zone: "Bastos",
    createdAt: new Date().toISOString(),
    commentsCount: 0,
    sharesCount: 0,
    likedAuthor: false,
    viewerFollows: false,
    authorActiveLikes: 0,
    author: {
      id: "a",
      username: "a",
      firstName: "A",
      lastName: "A",
      certified: false,
      avatarUrl: null,
    },
    ...extra,
  };
}

function event(id: string): EventCard {
  return {
    id,
    title: `event ${id}`,
    description: "",
    imageUrl: "/seed/events/afterwork.jpg",
    city: "Yaoundé",
    zone: "Bastos",
    venue: null,
    startsAt: new Date(Date.now() + 3600_000).toISOString(),
    endsAt: null,
    priceXaf: 0,
    currency: "XAF",
    capacity: 20,
    taken: 0,
    minAge: 18,
    requiresReservation: false,
    status: "PUBLISHED",
    hearts: 0,
    viewerHearted: false,
    viewerInterested: false,
    viewerStatus: null,
    isHost: false,
    host: { id: "h", username: "h", firstName: "H", lastName: "H", certified: false, avatarUrl: null },
  };
}

function person(id: string): PersonCard {
  return {
    id,
    username: `u${id}`,
    firstName: "Léa",
    lastName: id,
    certified: false,
    profession: "DJ",
    age: 24,
    avatarUrl: "/seed/avatars/cesar.jpg",
    locationLabel: "Bastos",
    approximate: true,
    distanceKm: 1,
    presence: "AVAILABLE",
    circle: "NEARBY",
  };
}

function mood(id: string): MoodItem {
  return {
    id,
    body: "live",
    imageUrl: null,
    videoUrl: "/seed/moods/video-concert.mp4",
    expiresAt: null,
    createdAt: new Date().toISOString(),
    commentsCount: 0,
    likedAuthor: false,
    authorActiveLikes: 0,
    activity: null,
    city: "Yaoundé",
    zone: "Bastos",
    event: null,
    companion: null,
    author: {
      id: "m",
      username: "m",
      firstName: "Mia",
      lastName: "M",
      certified: false,
      avatarUrl: null,
      city: "Yaoundé",
    },
  };
}

describe("mixHomeFeed", () => {
  it("mélange moods, personnes et events sans motif figé", () => {
    const mixed = mixHomeFeed(
      {
        posts: [post("p1", { imageUrl: "/x.jpg" }), post("p2"), post("p3", { imageUrl: "/y.jpg" })],
        events: [event("e1")],
        people: [person("u1")],
        moods: [mood("m1")],
      },
      () => 0,
    );
    expect(mixed.some((row) => row.kind === "mood")).toBe(true);
    expect(mixed.some((row) => row.kind === "person")).toBe(true);
    expect(mixed.some((row) => row.kind === "event")).toBe(true);
    expect(mixed.filter((row) => row.kind === "post")).toHaveLength(3);
    for (let i = 1; i < mixed.length; i += 1) {
      expect(mixed[i]!.kind).not.toBe(mixed[i - 1]!.kind);
    }
  });

  it("propose les dispos en cartes invite sans vider le deck", () => {
    const mixed = mixHomeFeed(
      {
        posts: [post("p1", { imageUrl: "/x.jpg" })],
        events: [],
        people: [
          person("u1"),
          { ...person("u2"), firstName: "Mia", why: [{ key: "nearby_available" }] },
        ],
        moods: [],
      },
      () => 0,
    );
    expect(mixed.some((row) => row.kind === "invite")).toBe(true);
    expect(mixed.some((row) => row.kind === "person")).toBe(true);
    const inviteIds = mixed.filter((row) => row.kind === "invite").map((row) => row.person.id);
    const deckIds = mixed.filter((row) => row.kind === "person").map((row) => row.person.id);
    expect(inviteIds.some((id) => deckIds.includes(id))).toBe(false);
  });

  it("limite les vidéos mood dans le fil", () => {
    const mixed = mixHomeFeed(
      {
        posts: [post("p1", { imageUrl: "/x.jpg" }), post("p2"), post("p3", { imageUrl: "/y.jpg" })],
        events: [event("e1")],
        people: [person("u1")],
        moods: [mood("m1"), mood("m2"), mood("m3"), mood("m4")],
      },
      () => 0.4,
    );
    expect(mixed.filter((row) => row.kind === "mood")).toHaveLength(MAX_HOME_FEED_MOODS);
  });

  it("n’ajoute pas un event déjà lié à un post", () => {
    const mixed = mixHomeFeed({
      posts: [post("p1", { imageUrl: "/x.jpg", event: { id: "e1", title: "Soirée", startsAt: new Date().toISOString() } })],
      events: [event("e1")],
      people: [],
      moods: [],
    });
    expect(mixed.filter((row) => row.kind === "event")).toHaveLength(0);
    expect(mixed).toHaveLength(1);
  });
});

describe("splitFeedPeople", () => {
  it("garde une seule personne dans le deck swipe", () => {
    const { invitees, deck } = splitFeedPeople([person("u1")]);
    expect(invitees).toEqual([]);
    expect(deck).toHaveLength(1);
  });

  it("priorise une dispo proche / affinité pour la carte invite", () => {
    const far = { ...person("far"), distanceKm: 8, why: [] };
    const match = {
      ...person("match"),
      distanceKm: 1,
      why: [{ key: "nearby_available" }, { key: "shared_interests", count: 3 }],
      activeMood: { id: "m", activity: "Piscine", body: "On s’ennuie", expiresAt: null as never },
    };
    const { invitees, deck } = splitFeedPeople([far, match]);
    expect(invitees.map((p) => p.id)).toEqual(["match"]);
    expect(deck.map((p) => p.id)).toEqual(["far"]);
  });
});
