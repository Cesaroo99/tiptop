import { describe, expect, it } from "vitest";
import {
  clipLabel,
  likePlacementHref,
  likePlacementLabel,
  parseLikePlacementKind,
  postLeadLabel,
} from "./like-placement";

describe("like placement meta", () => {
  it("résout le lien vers l’événement lié plutôt que le post", () => {
    expect(likePlacementHref("post", { id: "p1", eventId: "evt-1" })).toBe("/events/evt-1");
    expect(likePlacementHref("post", { id: "p1" })).toBe("/posts/p1");
    expect(likePlacementHref("user", { id: "u1", username: "cesar_memoli" })).toBe("/u/cesar_memoli");
    expect(likePlacementHref("mood", { id: "m1" })).toBe("/mood/m1");
    expect(likePlacementHref("comment", { id: "c1", postId: "p1" })).toBe("/posts/p1");
  });

  it("prend le titre d’événement ou l’accroche avant « : »", () => {
    expect(likePlacementLabel("post", { title: "Expo photo Hilton", body: "Expo : venez." })).toBe(
      "Expo photo Hilton",
    );
    expect(likePlacementLabel("post", { body: "Un tour au Black&White : on sort." })).toBe(
      "Un tour au Black&White",
    );
    expect(likePlacementLabel("user", { name: "César Memoli" })).toBe("César Memoli");
    expect(likePlacementLabel("mood", { activity: "Rooftop", body: "en ville" })).toBe("Rooftop");
  });

  it("coupe les libellés trop longs", () => {
    expect(clipLabel("abc", 5)).toBe("abc");
    expect(clipLabel("abcdefghij", 5)).toBe("abcd…");
    expect(postLeadLabel("Match à Omnisports puis bières.")).toBe("Match à Omnisports puis bières.");
    expect(parseLikePlacementKind("POST")).toBe("post");
    expect(parseLikePlacementKind("story")).toBeNull();
  });
});
