"use client";

import type { PresenceState } from "@tiptop/domain";
import { presenceFromDeclared } from "@tiptop/domain";
import { useI18n } from "@/lib/i18n";

export type BadgePresence = PresenceState | "HIDDEN" | "BUSY" | "AVAILABLE";

function resolvePresence(presence?: BadgePresence, available?: boolean): PresenceState {
  if (presence) return presenceFromDeclared(presence === "UNAVAILABLE" ? "HIDDEN" : presence);
  return available ? "AVAILABLE" : "UNAVAILABLE";
}

/**
 * Voyant de disponibilité : vert (disponible), orange (je ne sais pas),
 * rouge (indisponible). Jamais un simple texte.
 */
export function AvailabilityBadge({
  presence,
  available,
  compact = false,
}: {
  presence?: BadgePresence;
  available?: boolean;
  compact?: boolean;
}) {
  const { messages } = useI18n();
  const state = resolvePresence(presence, available);
  const label =
    state === "AVAILABLE" ? messages.world.available : state === "UNSURE" ? messages.world.unsure : messages.world.unavailable;
  const tone =
    state === "AVAILABLE"
      ? { wrap: "bg-success-soft text-success", text: "text-success" }
      : state === "UNSURE"
        ? { wrap: "bg-warning-soft text-warning", text: "text-warning" }
        : { wrap: "bg-danger-soft text-danger", text: "text-danger" };

  if (compact) {
    return (
      <span className={`type-caption inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-semibold ${tone.wrap}`}>
        <Dot state={state} />
        {label}
      </span>
    );
  }
  return (
    <span className={`type-caption inline-flex items-center gap-1.5 font-semibold ${tone.text}`}>
      <Dot state={state} />
      {label}
    </span>
  );
}

export function PresenceDot({
  presence,
  available,
  className = "",
}: {
  presence?: BadgePresence;
  available?: boolean;
  className?: string;
}) {
  return <Dot state={resolvePresence(presence, available)} className={className} />;
}

function Dot({ state, className = "" }: { state: PresenceState; className?: string }) {
  const color = state === "AVAILABLE" ? "bg-success" : state === "UNSURE" ? "bg-warning" : "bg-danger";
  return (
    <span className={`relative inline-flex h-2.5 w-2.5 ${className}`} aria-hidden>
      {state === "AVAILABLE" ? (
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
      ) : null}
      <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${color}`} />
    </span>
  );
}
