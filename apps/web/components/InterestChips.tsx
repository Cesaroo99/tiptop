"use client";

import { isMoodInterest, MOOD_INTERESTS, type MoodInterestId } from "@tiptop/domain";
import { useI18n } from "@/lib/i18n";

export function InterestChips({
  value,
  onChange,
  multiple = false,
}: {
  value: string | string[] | null;
  onChange: (next: MoodInterestId[] | MoodInterestId) => void;
  multiple?: boolean;
}) {
  const { locale } = useI18n();
  const selected = new Set<MoodInterestId>(
    (Array.isArray(value) ? value : value ? [value] : []).filter(isMoodInterest),
  );

  return (
    <div className="flex flex-wrap gap-2">
      {MOOD_INTERESTS.map((item) => {
        const active = selected.has(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              if (multiple) {
                const next: MoodInterestId[] = active
                  ? [...selected].filter((id) => id !== item.id)
                  : [...selected, item.id];
                onChange(next);
              } else {
                onChange(item.id);
              }
            }}
            className={`type-caption tap-scale rounded-pill px-3 py-1.5 font-semibold ${
              active ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
            }`}
          >
            {locale === "en" ? item.en : item.fr}
          </button>
        );
      })}
    </div>
  );
}
