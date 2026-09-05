import { describe, expect, it } from "vitest";
import { applySoleLike, releaseViewerLike } from "./like-feed";
import type { FeedItem } from "./api";

function item(id: string, liked: boolean): FeedItem {
  return {
    id,
    body: "x",
    imageUrl: null,
    city: "Yaoundé",
    zone: null,
    createdAt: new Date().toISOString(),
    commentsCount: 0,
    likedAuthor: false,
    likedByMe: liked,
    viewerFollows: false,
    authorActiveLikes: liked ? 1 : 0,
    likeTime: { totalSeconds: liked ? 40 : 0, activeCount: liked ? 1 : 0, likedByMe: liked, label: liked ? "40 s" : "0 s" },
    author: {
      id: "a",
      username: "u",
      firstName: "A",
      lastName: "B",
      certified: false,
      avatarUrl: null,
    },
  };
}

describe("like unique dans le fil", () => {
  it("retirer le like d’une carte arrête le décompte actif", () => {
    const released = releaseViewerLike(item("p1", true));
    expect(released.likedByMe).toBe(false);
    expect(released.likeTime?.likedByMe).toBe(false);
    expect(released.likeTime?.activeCount).toBe(0);
  });

  it("liker B enlève le like de A", () => {
    const a = item("a", true);
    const b = item("b", false);
    const nextB = { ...b, likedByMe: true, likeTime: { totalSeconds: 0, activeCount: 1, likedByMe: true, label: "0 s" } };
    const out = applySoleLike([a, b], nextB);
    expect(out[0]?.likedByMe).toBe(false);
    expect(out[0]?.likeTime?.activeCount).toBe(0);
    expect(out[1]?.likedByMe).toBe(true);
    expect(out[1]?.likeTime?.activeCount).toBe(1);
  });
});
