import { describe, expect, it } from "vitest";
import { leftoverFeedEntries, rebuildStream, type FeedCache } from "./feed-session";
import type { FeedItem } from "./api";

function post(id: string): FeedItem {
  return {
    id,
    body: id,
    imageUrl: null,
    city: "Yaoundé",
    zone: "Bastos",
    createdAt: new Date().toISOString(),
    commentsCount: 0,
    sharesCount: 0,
    likedAuthor: false,
    viewerFollows: false,
    authorActiveLikes: 0,
    author: { id: "a", username: "a", firstName: "A", lastName: "A", certified: false, avatarUrl: null },
  };
}

describe("feed session", () => {
  it("reconstruit le flux dans le même ordre", () => {
    const p1 = post("p1");
    const cache: FeedCache = {
      items: [p1],
      events: [],
      people: [],
      reels: [],
      moods: [],
      order: [{ kind: "post", id: "post:p1" }],
      nextCursor: p1.createdAt,
      hasMore: true,
      scrollTop: 420,
      lastVisibleId: "post:p1",
      at: Date.now(),
    };
    const stream = rebuildStream(cache);
    expect(stream).toHaveLength(1);
    expect(stream[0]).toMatchObject({ kind: "post", id: "post:p1" });
  });
});

describe("leftoverFeedEntries", () => {
  it("ajoute les événements encore absents du flux", () => {
    const leftover = leftoverFeedEntries([{ kind: "post", id: "post:p1", post: post("p1") }], {
      events: [{ id: "e1" } as never],
      people: [],
      moods: [],
    });
    expect(leftover[0]).toMatchObject({ kind: "event", id: "event:e1" });
  });

  it("ajoute une invite sans dupliquer la personne du deck", () => {
    const leftover = leftoverFeedEntries(
      [{ kind: "person", id: "person:u1", person: { id: "u1" } as never }],
      {
        events: [],
        people: [{ id: "u1" } as never, { id: "u2" } as never],
        invitees: [{ id: "u2" } as never],
        moods: [],
      },
    );
    expect(leftover).toEqual([
      expect.objectContaining({ kind: "invite", id: "invite:u2" }),
    ]);
  });
});
