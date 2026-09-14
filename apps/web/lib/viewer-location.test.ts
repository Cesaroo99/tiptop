import { describe, expect, it } from "vitest";
import { parseLocationState, placeCoords, serializeLocationState } from "./viewer-location";

describe("viewer location", () => {
  it("par défaut : position réelle, pas figée", () => {
    expect(parseLocationState(null)).toEqual({ mode: "CURRENT", fixed: null });
    expect(parseLocationState("{")).toEqual({ mode: "CURRENT", fixed: null });
  });

  it("fige une zone catalogue et revient au réel", () => {
    const coords = placeCoords("Yaoundé", "Bastos");
    expect(coords?.latitude).toBeCloseTo(3.89);
    const raw = serializeLocationState({
      mode: "FIXED",
      fixed: { city: "Yaoundé", zone: "Bastos", latitude: coords!.latitude, longitude: coords!.longitude, label: "Yaoundé - Bastos" },
    });
    expect(parseLocationState(raw).mode).toBe("FIXED");
    expect(parseLocationState(serializeLocationState({ mode: "CURRENT", fixed: parseLocationState(raw).fixed })).mode).toBe(
      "CURRENT",
    );
  });
});
