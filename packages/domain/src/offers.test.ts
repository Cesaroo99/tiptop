import { describe, expect, it } from "vitest";
import { offerDistanceKm, rankOffers } from "./offers";

describe("classement des offres locales", () => {
  const items = [
    { id: "far-cheap", priceXaf: 500, distanceKm: 8 },
    { id: "near-mid", priceXaf: 2000, distanceKm: 1 },
    { id: "near-cheap", priceXaf: 800, distanceKm: 1 },
  ];

  it("près de moi : d’abord la distance, puis le prix", () => {
    expect(rankOffers(items, "near").map((i) => i.id)).toEqual(["near-cheap", "near-mid", "far-cheap"]);
  });

  it("moins cher : d’abord le prix, puis la distance", () => {
    expect(rankOffers(items, "price").map((i) => i.id)).toEqual(["far-cheap", "near-cheap", "near-mid"]);
  });

  it("calcule une distance à partir des coordonnées", () => {
    const km = offerDistanceKm({ latitude: 3.848, longitude: 11.5021 }, { latitude: 3.89, longitude: 11.512 });
    expect(km).toBeGreaterThan(3);
    expect(km).toBeLessThan(8);
  });
});
