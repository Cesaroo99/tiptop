/** Disponibilité déclarée — jamais déduite du scroll (D10). */

export const DEFAULT_AVAILABILITY_TTL_HOURS = 4;
export const MIN_AVAILABILITY_TTL_HOURS = 1;
export const MAX_AVAILABILITY_TTL_HOURS = 24;

export type AvailabilityStatus = "HIDDEN" | "BUSY" | "AVAILABLE";

export function clampAvailabilityTtlHours(hours?: number): number {
  if (hours == null || Number.isNaN(hours)) return DEFAULT_AVAILABILITY_TTL_HOURS;
  return Math.min(MAX_AVAILABILITY_TTL_HOURS, Math.max(MIN_AVAILABILITY_TTL_HOURS, Math.round(hours)));
}

export function availabilityUntil(from: Date, ttlHours?: number): Date {
  const hours = clampAvailabilityTtlHours(ttlHours);
  return new Date(from.getTime() + hours * 3600_000);
}

export function isCurrentlyAvailable(input: {
  availability: AvailabilityStatus;
  availabilityUntil: Date | null;
  now?: Date;
}): boolean {
  if (input.availability !== "AVAILABLE") return false;
  if (!input.availabilityUntil) return false;
  const now = input.now ?? new Date();
  return input.availabilityUntil.getTime() > now.getTime();
}

/** Voyant public : vert / orange / rouge — jamais déduit du scroll. */
export type PresenceState = "AVAILABLE" | "UNSURE" | "UNAVAILABLE";

export function presenceState(input: {
  availability: AvailabilityStatus;
  availabilityUntil: Date | null;
  now?: Date;
}): PresenceState {
  if (isCurrentlyAvailable(input)) return "AVAILABLE";
  if (input.availability === "BUSY") return "UNSURE";
  return "UNAVAILABLE";
}

export function presenceFromDeclared(availability?: string | null): PresenceState {
  if (availability === "AVAILABLE") return "AVAILABLE";
  if (availability === "BUSY" || availability === "UNSURE") return "UNSURE";
  return "UNAVAILABLE";
}
