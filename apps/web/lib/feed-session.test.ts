import { describe, expect, it } from "vitest";
import { rebuildStream, type FeedCache } from "./feed-session";
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
      at: Date.now(),
    };
    const stream = rebuildStream(cache);
    expect(stream).toHaveLength(1);
    expect(stream[0]).toMatchObject({ kind: "post", id: "post:p1" });
  });
});
