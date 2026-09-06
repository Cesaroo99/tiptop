"use client";

import { presenceFromDeclared, type PresenceState } from "@tiptop/domain";
import { PresenceDot } from "@/components/AvailabilityBadge";
import { useI18n } from "@/lib/i18n";

const OPTIONS = [
  ["AVAILABLE", "available"],
  ["BUSY", "unsure"],
  ["HIDDEN", "unavailable"],
] as const;

export function PresencePicker({
  value,
  busy,
  onChange,
}: {
  value: PresenceState;
  busy?: boolean;
  onChange: (availability: "AVAILABLE" | "BUSY" | "HIDDEN") => void;
}) {
  const { messages } = useI18n();
  const labels = {
    available: messages.world.available,
    unsure: messages.world.unsure,
    unavailable: messages.world.unavailable,
  };

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {OPTIONS.map(([key, labelKey]) => {
        const active = value === presenceFromDeclared(key);
        return (
          <button
            key={key}
            type="button"
            disabled={busy}
            aria-pressed={active}
            onClick={() => onChange(key)}
            className={`type-caption inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 font-semibold ${
              active ? "bg-accent-soft text-ink ring-1 ring-accent/25" : "bg-surface-sunken text-muted"
            }`}
          >
            <PresenceDot presence={key} />
            {labels[labelKey]}
          </button>
        );
      })}
    </div>
  );
}
