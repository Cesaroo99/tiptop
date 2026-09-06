import { describe, expect, it } from "vitest";
import { eventDirectionsUrl, eventDistanceLabel, eventPlaceLabel, hasExactCoords } from "./event-place";

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

  it("itinéraire : coords exactes, sinon adresse — jamais le centroïde de zone", () => {
    expect(hasExactCoords(3.89, 11.512)).toBe(true);
    expect(hasExactCoords(null, 11.512)).toBe(false);
    const withCoords = eventDirectionsUrl({
      city: "Yaoundé",
      zone: "Bastos",
      venue: "Rooftop 237",
      latitude: 3.891,
      longitude: 11.515,
    });
    expect(withCoords).toContain("3.891,11.515");
    const addressOnly = eventDirectionsUrl({
      city: "Yaoundé",
      zone: "Bastos",
      venue: "Centre Bell",
      address: "1234 Rue X, Montréal",
    });
    expect(addressOnly).toContain(encodeURIComponent("1234 Rue X, Montréal"));
    expect(addressOnly).not.toMatch(/3\.89,11\.512/);
  });
});
