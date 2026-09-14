import { describe, expect, it } from "vitest";
import { fr } from "@tiptop/i18n";
import { reasonLabel } from "./intelligence";

describe("reasonLabel", () => {
  it("traduit les clés de recommandation", () => {
    expect(reasonLabel("habit_category", fr.intel)).toBe(fr.intel.reasonHabit);
    expect(reasonLabel("budget_fit", fr.intel)).toBe(fr.intel.reasonBudget);
    expect(reasonLabel("unknown", fr.intel)).toBe(fr.intel.seeWhy);
  });
});
