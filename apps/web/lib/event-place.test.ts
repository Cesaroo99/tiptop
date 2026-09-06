import { describe, expect, it } from "vitest";
import { eventDistanceLabel, eventPlaceLabel } from "./event-place";

describe("event place", () => {
  it("préfère le lieu nommé à la seule ville", () => {
    expect(eventPlaceLabel({ venue: "Centre Bell", city: "Montréal" })).toBe("Centre Bell, Montréal");
    expect(eventPlaceLabel({ venue: "Rooftop 237", zone: "Bastos", city: "Yaoundé" })).toBe(
      "Rooftop 237, Bastos, Yaoundé",
    );
    expect(eventPlaceLabel({ address: "1234 Rue X", city: "Montréal" })).toBe("1234 Rue X");
  });

  it("calcule une distance approximative depuis l’origine", () => {
    const label = eventDistanceLabel(
      { latitude: 3.848, longitude: 11.5021 },
      { latitude: 3.89, longitude: 11.512, city: "Yaoundé", zone: "Bastos" },
    );
    expect(label).toMatch(/km|m/);
  });

  it("sans origine : pas de distance inventée", () => {
    expect(eventDistanceLabel(null, { latitude: 3.89, longitude: 11.512 })).toBeNull();
  });
});
