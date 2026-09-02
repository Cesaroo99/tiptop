import { describe, expect, it } from "vitest";
import {
  CERTIFIED_LIKE_WEIGHT,
  crossedMilestones,
  DEFAULT_LIKE_MILESTONES,
  formatLikeDuration,
  highestMilestone,
  LIKE_YEAR_SECONDS,
  liveLikeSeconds,
  periodDurationSeconds,
  sumLikeSeconds,
} from "./like-time";

describe("périodes de like", () => {
  it("Alice 40 min sur une publication", () => {
    const start = new Date("2026-09-01T10:00:00Z");
    const end = new Date("2026-09-01T10:40:00Z");
    expect(periodDurationSeconds({ startedAt: start, endedAt: end }, end)).toBe(40 * 60);
  });

  it("Alice 40 min + César 10 min = 50 min", () => {
    const now = new Date("2026-09-01T10:40:00Z");
    const sum = sumLikeSeconds(
      [
        { startedAt: new Date("2026-09-01T10:00:00Z"), endedAt: new Date("2026-09-01T10:40:00Z") },
        { startedAt: new Date("2026-09-01T10:30:00Z"), endedAt: new Date("2026-09-01T10:40:00Z") },
      ],
      now,
    );
    expect(sum.totalSeconds).toBe(50 * 60);
    expect(sum.historicalSeconds).toBe(50 * 60);
    expect(sum.activeSeconds).toBe(0);
  });

  it("un transfert clôture la première période sans l’effacer", () => {
    const now = new Date("2026-09-01T11:00:00Z");
    const aliceClosed = periodDurationSeconds(
      { startedAt: new Date("2026-09-01T10:00:00Z"), endedAt: new Date("2026-09-01T10:40:00Z") },
      now,
    );
    const sarahActive = periodDurationSeconds(
      { startedAt: new Date("2026-09-01T10:40:00Z"), endedAt: null },
      now,
    );
    expect(aliceClosed).toBe(40 * 60);
    expect(sarahActive).toBe(20 * 60);
  });

  it("un like actif continue de progresser", () => {
    const start = new Date("2026-09-01T10:00:00Z");
    expect(periodDurationSeconds({ startedAt: start, endedAt: null }, new Date("2026-09-01T10:15:00Z"))).toBe(15 * 60);
    expect(periodDurationSeconds({ startedAt: start, endedAt: null }, new Date("2026-09-01T11:00:00Z"))).toBe(3600);
  });

  it("agrège le profil sans double comptage (sommes distinctes)", () => {
    const now = new Date("2026-09-01T18:00:00Z");
    const profile = sumLikeSeconds(
      [
        { startedAt: new Date("2026-09-01T10:00:00Z"), endedAt: new Date("2026-09-01T10:50:00Z") },
        { startedAt: new Date("2026-09-01T08:00:00Z"), endedAt: new Date("2026-09-01T10:00:00Z") },
        { startedAt: new Date("2026-09-01T12:00:00Z"), endedAt: new Date("2026-09-01T12:20:00Z") },
        { startedAt: new Date("2026-09-01T13:00:00Z"), endedAt: new Date("2026-09-01T14:00:00Z") },
        { startedAt: new Date("2026-09-01T15:00:00Z"), endedAt: new Date("2026-09-01T18:00:00Z") },
      ],
      now,
    );
    expect(profile.totalSeconds).toBe((50 + 120 + 20 + 60 + 180) * 60);
  });
});

describe("formatLikeDuration", () => {
  it("3723 s → 1 h 2 min", () => {
    expect(formatLikeDuration(3723, "fr")).toBe("1 h 2 min");
  });

  it("45 secondes", () => {
    expect(formatLikeDuration(45, "fr")).toBe("45 secondes");
  });

  it("2 minutes", () => {
    expect(formatLikeDuration(120, "fr")).toBe("2 min");
  });

  it("2 jours 4 h", () => {
    expect(formatLikeDuration((2 * 86400) + (4 * 3600), "fr")).toBe("2 jours 4 h");
  });

  it("3 mois 12 jours", () => {
    expect(formatLikeDuration((3 * 30 * 86400) + (12 * 86400), "fr")).toBe("3 mois 12 jours");
  });

  it("1 an 4 mois", () => {
    expect(formatLikeDuration(LIKE_YEAR_SECONDS + 4 * 30 * 86400, "fr")).toBe("1 an 4 mois");
  });

  it("8 ans", () => {
    expect(formatLikeDuration(8 * LIKE_YEAR_SECONDS, "fr")).toBe("8 ans");
    expect(formatLikeDuration(8 * LIKE_YEAR_SECONDS, "en")).toBe("8 years");
  });
});

describe("paliers", () => {
  it("célèbre le passage 59 min 59 s → 1 h", () => {
    const hit = crossedMilestones(3599, 3600);
    expect(hit.map((m) => m.id)).toEqual(["1h"]);
  });

  it("ne recélèbre pas le même palier", () => {
    expect(crossedMilestones(3600, 3601).map((m) => m.id)).toEqual([]);
    expect(crossedMilestones(4000, 5000).map((m) => m.id)).toEqual([]);
  });

  it("plus haut palier pour 8 ans", () => {
    expect(highestMilestone(8 * LIKE_YEAR_SECONDS)?.id).toBe("5y");
    expect(highestMilestone(10 * LIKE_YEAR_SECONDS)?.id).toBe("10y");
  });

  it("expose les paliers configurables", () => {
    expect(DEFAULT_LIKE_MILESTONES[0]?.seconds).toBe(60);
    expect(CERTIFIED_LIKE_WEIGHT).toBe(1);
  });
});

describe("liveLikeSeconds", () => {
  it("fait progresser un like actif sans écriture DB", () => {
    const fetched = new Date("2026-09-01T10:00:00Z");
    const later = new Date("2026-09-01T10:00:40Z");
    expect(liveLikeSeconds(100, 1, fetched, later)).toBe(140);
    expect(liveLikeSeconds(100, 2, fetched, later)).toBe(180);
    expect(liveLikeSeconds(100, 0, fetched, later)).toBe(100);
  });
});
