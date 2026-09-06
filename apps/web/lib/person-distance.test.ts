import { describe, expect, it } from "vitest";
import { personDistanceFromMe } from "./person-distance";

describe("personDistanceFromMe", () => {
  it("calcule depuis l’origine du visiteur", () => {
    const label = personDistanceFromMe(
      { latitude: 3.848, longitude: 11.5021 },
      { city: "Yaoundé", zone: "Bastos" },
    );
    expect(label).toMatch(/km|m/);
  });

  it("sans origine : se rabat sur la distance API", () => {
    expect(personDistanceFromMe(null, { distanceKm: 1 })).toBe("1 km");
    expect(personDistanceFromMe(null, { distanceLabel: "400 m" })).toBe("400 m");
  });

  it("sans origine ni distance : rien d’inventé", () => {
    expect(personDistanceFromMe(null, {})).toBeNull();
  });
});
