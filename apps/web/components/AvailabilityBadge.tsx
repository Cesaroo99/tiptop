"use client";

import { useI18n } from "@/lib/i18n";

/**
 * Badge standard de disponibilité (#16-17, #22) : pastille + libellé,
 * cohérent partout (profil, feed, découverte). Jamais un simple texte vert.
 */
export function AvailabilityBadge({ available, compact = false }: { available: boolean; compact?: boolean }) {
  const { messages } = useI18n();
  const label = available ? messages.world.available : messages.world.unavailable;

  if (compact) {
    return (
      <span
        className={`type-caption inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-semibold ${available ? "bg-success-soft text-success" : "bg-surface-sunken text-muted"}`}
      >
        <Dot available={available} />
        {label}
      </span>
    );
  }
  return (
    <span className={`type-caption inline-flex items-center gap-1.5 font-semibold ${available ? "text-success" : "text-muted"}`}>
      <Dot available={available} />
      {label}
    </span>
  );
}

function Dot({ available }: { available: boolean }) {
  return (
    <span className="relative inline-flex h-2 w-2" aria-hidden>
      {available ? (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
      ) : null}
      <span className={`relative inline-flex h-2 w-2 rounded-full ${available ? "bg-success" : "bg-disabled"}`} />
    </span>
  );
}
