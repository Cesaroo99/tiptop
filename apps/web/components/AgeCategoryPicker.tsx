"use client";

import { ageCategoryFromMinAge, EVENT_AGE_CATEGORIES } from "@tiptop/domain";

/**
 * Sélecteur de catégorie d'âge standardisée pour un événement (#16), plutôt
 * qu'un champ numérique libre — l'organisateur choisit un seuil reconnaissable
 * (Tout âge / -13 / -16 / 18+ / 21+), la valeur stockée reste `minAge` (int).
 */
export function AgeCategoryPicker({ minAge, onChange }: { minAge: number; onChange: (minAge: number) => void }) {
  const active = ageCategoryFromMinAge(minAge);
  return (
    <div className="flex flex-wrap gap-2">
      {EVENT_AGE_CATEGORIES.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.minAge)}
          className={`tap-scale type-body-sm rounded-pill px-3.5 py-2 font-semibold transition ${
            active === c.id ? "bg-accent text-on-primary" : "bg-surface-sunken text-ink"
          }`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
