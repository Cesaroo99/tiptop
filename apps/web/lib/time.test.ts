import { describe, expect, it } from "vitest";
import { formatCompactCount, formatCountdownLabel, splitPostLead } from "./time";

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

describe("formatCountdownLabel", () => {
  it("affiche les minutes comme sur la maquette", () => {
    const soon = new Date(Date.now() + 13 * 60_000).toISOString();
    expect(formatCountdownLabel(soon)).toBe("13min");
  });
});
