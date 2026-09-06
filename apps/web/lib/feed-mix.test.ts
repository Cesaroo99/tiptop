import { describe, expect, it } from "vitest";
import { mixHomeFeed } from "./feed-mix";
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
  it("alterne moods, personnes et events parmi les posts", () => {
    const mixed = mixHomeFeed(
      {
        posts: [post("p1", { imageUrl: "/x.jpg" }), post("p2"), post("p3", { imageUrl: "/y.jpg" })],
        events: [event("e1")],
        people: [person("u1")],
        moods: [mood("m1")],
      },
      () => 0,
    );
    expect(mixed.map((row) => row.kind)).toEqual(["mood", "post", "person", "event", "post", "post"]);
    expect(mixed.some((row) => row.kind === "mood")).toBe(true);
    expect(mixed.some((row) => row.kind === "person")).toBe(true);
    expect(mixed.some((row) => row.kind === "event")).toBe(true);
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
