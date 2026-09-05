import { describe, expect, it } from "vitest";
import { formatCompactCount, formatCountdownLabel, formatEventDateBadge, formatFcfa, splitPostLead } from "./time";

describe("formatCompactCount", () => {
  it("garde les petits nombres et compacte les milliers", () => {
    expect(formatCompactCount(3)).toBe("3");
    expect(formatCompactCount(46)).toBe("46");
    expect(formatCompactCount(3400)).toBe("3.4k");
    expect(formatCompactCount(12_000)).toBe("12k");
  });
});

describe("splitPostLead", () => {
  it("met en avant le titre avant le deux-points", () => {
    const split = splitPostLead("Un tour au Black&White : on se retrouve ce soir. 🥳💎");
    expect(split.lead).toBe("Un tour au Black&White :");
    expect(split.rest).toContain("on se retrouve");
  });
});

describe("formatFcfa", () => {
  it("affiche le prix comme sur la maquette", () => {
    expect(formatFcfa(5000)).toBe("5.000 FCFA");
    expect(formatFcfa(0)).toBe("0 FCFA");
  });
});

describe("formatEventDateBadge", () => {
  it("met le jour et le mois en avant", () => {
    expect(formatEventDateBadge("2026-10-13T18:00:00+01:00", "fr")).toMatch(/Mardi/i);
    expect(formatEventDateBadge("2026-10-13T18:00:00+01:00", "fr")).toMatch(/Octobre/i);
  });
});

describe("formatCountdownLabel", () => {
  it("affiche les minutes comme sur la maquette", () => {
    const soon = new Date(Date.now() + 13 * 60_000).toISOString();
    expect(formatCountdownLabel(soon)).toBe("13min");
  });
});
