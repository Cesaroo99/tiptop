import { describe, expect, it } from "vitest";
import { normalizePostImages, postImageList } from "./post-images";

describe("postImageList", () => {
  it("utilise imageUrl seul", () => {
    expect(postImageList({ imageUrl: "/seed/a.jpg" })).toEqual(["/seed/a.jpg"]);
  });

  it("déduplique imageUrl et imageUrls", () => {
    expect(
      postImageList({
        imageUrl: "/seed/a.jpg",
        imageUrls: ["/seed/a.jpg", "/seed/b.jpg", "/seed/b.jpg"],
      }),
    ).toEqual(["/seed/a.jpg", "/seed/b.jpg"]);
  });
});

describe("normalizePostImages", () => {
  it("ignore les URLs hors /seed/", () => {
    expect(
      normalizePostImages({
        imageUrl: "https://evil.example/x.jpg",
        imageUrls: ["/seed/ok.jpg", "http://x"],
      }),
    ).toEqual(["/seed/ok.jpg"]);
  });
});
