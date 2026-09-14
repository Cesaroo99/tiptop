import { describe, expect, it } from "vitest";
import {
  applyPreferenceSignal,
  buildExperiencePlan,
  canRunAgent,
  canSocialMatch,
  cityDiscoveryPercent,
  DEFAULT_AI_CONSENT,
  emptyPreferenceVector,
  experienceMoodToSignal,
  feedbackToSignal,
  filterScoredRecommendations,
  foldPreferenceSignals,
  inferCategoryFromText,
  parseOutingIntent,
  pickAdaptiveMissions,
  publicMatchDistance,
  refineExperiencePlan,
  scoreEventForUser,
  scoreSocialMatch,
  agentMayContactPeer,
  allowRate,
  INTEL_RATE_LIMITS,
} from "./intelligence";

const prefs = {
  vector: foldPreferenceSignals(
    [
      { kind: "ATTENDED", category: "sport" },
      { kind: "ATTENDED", category: "sport" },
      { kind: "FAVORITED", category: "concert" },
    ],
    ["sport"],
  ),
  disliked: [] as const,
  typicalBudgetXaf: 5000,
  maxBudgetXaf: 15000,
  maxDistanceKm: 12,
  preferredHours: { start: 18, end: 22 },
};

describe("préférences et signaux", () => {
  it("renforce une catégorie après des signaux positifs", () => {
    const next = applyPreferenceSignal(emptyPreferenceVector(), "ATTENDED", "sport");
    expect(next.sport).toBeGreaterThan(1);
    expect(next.food).toBe(0);
  });

  it("pénalise un type masqué", () => {
    const folded = foldPreferenceSignals([{ kind: "NOT_INTERESTED", category: "nightlife" }]);
    expect(folded.nightlife).toBeLessThan(0);
  });

  it("convertit un retour d’expérience", () => {
    expect(experienceMoodToSignal("LOVED")).toBe("POSITIVE_FEEDBACK");
    expect(feedbackToSignal("HIDE_TYPE")).toBe("NOT_INTERESTED");
  });
});

describe("filtrage des recommandations", () => {
  const future = new Date(Date.now() + 2 * 3600_000);
  const event = {
    id: "e1",
    title: "Basket en salle",
    description: "match amical sport",
    city: "Yaoundé",
    startsAt: future,
    priceXaf: 4000,
    latitude: 3.87,
    longitude: 11.52,
    interestedCount: 4,
  };

  it("score un event sport dans le budget", () => {
    const scored = scoreEventForUser(event, prefs, { latitude: 3.868, longitude: 11.516 });
    expect(scored.category).toBe("sport");
    expect(scored.score).toBeGreaterThan(0);
    expect(scored.reasons).toContain("budget_fit");
  });

  it("écarte un event hors budget", () => {
    const scored = scoreEventForUser({ ...event, priceXaf: 40000 }, prefs);
    expect(scored.reasons).toContain("over_budget");
    expect(filterScoredRecommendations([scored])).toEqual([]);
  });

  it("écarte une catégorie masquée", () => {
    const scored = scoreEventForUser(event, { ...prefs, disliked: ["sport"] });
    expect(scored.reasons).toContain("disliked_category");
  });
});

describe("intention et plan", () => {
  it("extrait budget, groupe et horaire", () => {
    const intent = parseOutingIntent("J'ai 50 $, je suis libre samedi soir, nous sommes trois et on veut du fun");
    expect(intent.budgetXaf).toBe(30000);
    expect(intent.partySize).toBe(3);
    expect(intent.dateHint).toBe("saturday");
    expect(intent.vibe).toBe("fun");
  });

  it("génère un parcours et remplace une étape", () => {
    const intent = parseOutingIntent("Je veux sortir ce soir");
    const events = [
      {
        id: "e1",
        title: "Concert rooftop",
        description: "live concert",
        city: "Yaoundé",
        startsAt: new Date(Date.now() + 3 * 3600_000),
        priceXaf: 5000,
      },
      {
        id: "e2",
        title: "After calme",
        description: "culture expo",
        city: "Yaoundé",
        startsAt: new Date(Date.now() + 5 * 3600_000),
        priceXaf: 0,
      },
    ];
    const plan = buildExperiencePlan({ intent, events, prefs: { ...prefs, maxBudgetXaf: 20000 } });
    expect(plan.steps.length).toBeGreaterThan(0);
    expect(plan.totalCostXaf).toBeGreaterThanOrEqual(0);
    const refined = refineExperiencePlan(plan.steps, "calmer", plan.steps);
    expect(refined.every((step) => step.category !== "nightlife")).toBe(true);
  });

  it("infère une catégorie aventure", () => {
    expect(inferCategoryFromText("escalade débutant")).toBe("adventure");
  });
});

describe("matching et consentement", () => {
  it("ne contacte jamais un pair automatiquement", () => {
    expect(agentMayContactPeer()).toBe(false);
    expect(canSocialMatch(DEFAULT_AI_CONSENT)).toBe(false);
    expect(canRunAgent(DEFAULT_AI_CONSENT)).toBe(false);
    expect(canSocialMatch({ ...DEFAULT_AI_CONSENT, socialMatch: true })).toBe(true);
  });

  it("score une personne dispo et masque le GPS exact", () => {
    const score = scoreSocialMatch(
      { id: "u", interests: ["sport"], available: true, distanceKm: 2.2, sameCategory: true, seeking: true },
      "sport",
    );
    expect(score).toBeGreaterThan(1);
    expect(publicMatchDistance(0.4)).toBe("<1 km");
    expect(publicMatchDistance(4.2)).toBe("4 km");
  });
});

describe("Mon Monde et limites", () => {
  it("calcule un pourcentage borné", () => {
    expect(cityDiscoveryPercent({ categoriesTried: 0, attendedCount: 0, uniqueVenues: 0, activeWeeks: 0 })).toBe(0);
    expect(
      cityDiscoveryPercent({ categoriesTried: 12, attendedCount: 20, uniqueVenues: 20, activeWeeks: 10 }),
    ).toBe(100);
    expect(cityDiscoveryPercent({ categoriesTried: 3, attendedCount: 2, uniqueVenues: 2, activeWeeks: 1 })).toBeGreaterThan(
      0,
    );
  });

  it("adapte les missions", () => {
    const missions = pickAdaptiveMissions({ triedCategories: ["sport"], attendedWithOthers: 0, uniqueVenuesInCity: 1 });
    expect(missions).toContain("FIRST_TIME");
    expect(missions).toContain("SOCIAL");
  });

  it("plafonne les appels", () => {
    expect(allowRate(7, INTEL_RATE_LIMITS.planPerHour)).toBe(true);
    expect(allowRate(8, INTEL_RATE_LIMITS.planPerHour)).toBe(false);
  });
});
