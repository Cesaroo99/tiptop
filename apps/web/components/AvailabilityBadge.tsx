"use client";

import { useI18n } from "@/lib/i18n";

/** Badge standard de disponibilité (#16-17), cohérent partout : profil, feed, découverte. */
export function AvailabilityBadge({ available, compact = false }: { available: boolean; compact?: boolean }) {
  const { messages } = useI18n();
  if (compact) {
    return (
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${available ? "bg-success/15 text-success" : "bg-[var(--border)] text-muted"}`}
      >
        {available ? `🟢 ${messages.world.available}` : `⚪ ${messages.world.unavailable}`}
      </span>
    );
  }
  return (
    <span className={`type-caption font-semibold ${available ? "text-success" : "text-muted"}`}>
      {available ? `🟢 ${messages.world.available}` : `⚪ ${messages.world.unavailable}`}
    </span>
  );
}
