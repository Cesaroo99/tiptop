import { describe, expect, it } from "vitest";
import {
  clipLabel,
  likePlacementHref,
  likePlacementLabel,
  parseLikePlacementKind,
  personDisplayName,
  postLeadLabel,
} from "./like-placement";

describe("like placement meta", () => {
  it("résout le lien vers l’événement lié plutôt que le post", () => {
    expect(likePlacementHref("post", { id: "p1", eventId: "evt-1" })).toBe("/events/evt-1");
    expect(likePlacementHref("post", { id: "p1" })).toBe("/posts/p1");
    expect(likePlacementHref("user", { id: "u1", username: "cesar_memoli" })).toBe("/u/cesar_memoli");
    expect(likePlacementHref("mood", { id: "m1" })).toBe("/mood/m1");
    expect(likePlacementHref("comment", { id: "c1", postId: "p1" })).toBe("/posts/p1");
    expect(likePlacementHref("comment", { id: "c2", moodId: "m1" })).toBe("/mood?start=m1");
  });

  it("affiche uniquement le nom de la personne à qui on donne de la vie", () => {
    expect(likePlacementLabel("post", { name: "César Memoli", title: "Expo photo Hilton", body: "Expo : venez." })).toBe(
      "César Memoli",
    );
    expect(likePlacementLabel("mood", { name: "Mia Patel", activity: "Rooftop", body: "en ville" })).toBe("Mia Patel");
    expect(likePlacementLabel("comment", { name: "Léa Moreau", body: "Trop bien cette soirée" })).toBe("Léa Moreau");
    expect(likePlacementLabel("wish", { name: "Mbelle Junior", title: "Un vélo" })).toBe("Mbelle Junior");
    expect(likePlacementLabel("user", { name: "César Memoli" })).toBe("César Memoli");
    expect(likePlacementLabel("post", { title: "Expo", body: "accroche" })).toBe("…");
    expect(personDisplayName("César", "Memoli")).toBe("César Memoli");
  });

  it("coupe les libellés trop longs", () => {
    expect(clipLabel("abc", 5)).toBe("abc");
    expect(clipLabel("abcdefghij", 5)).toBe("abcd…");
    expect(postLeadLabel("Match à Omnisports puis bières.")).toBe("Match à Omnisports puis bières.");
    expect(parseLikePlacementKind("POST")).toBe("post");
    expect(parseLikePlacementKind("story")).toBeNull();
  });
});
