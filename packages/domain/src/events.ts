/** Règles événements / invitations / moods — pures. */

export const DEFAULT_INVITATION_TTL_HOURS = 24;
export const MAX_MOOD_HOURS = 24;
export const DEFAULT_MOOD_HOURS = 12;

export type InvitationPayer = "HOST" | "GUEST" | "FREE";

export function ageFromBirthDate(birthDate: Date | null | undefined, now = new Date()): number | null {
  if (!birthDate) return null;
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age -= 1;
  return age;
}

export function meetsMinAge(birthDate: Date | null | undefined, minAge: number | null | undefined, now = new Date()): boolean {
  if (!minAge) return true;
  const age = ageFromBirthDate(birthDate, now);
  if (age == null) return false;
  return age >= minAge;
}

export function eventIsFull(capacity: number | null | undefined, taken: number): boolean {
  if (capacity == null) return false;
  return taken >= capacity;
}

export function eventIsFuture(startsAt: Date, now = new Date()): boolean {
  return startsAt.getTime() > now.getTime();
}

export type EventPhase = "upcoming" | "ongoing" | "ended";

/**
 * Cycle de vie d'un événement pour l'affichage (#9) : compte à rebours avant,
 * "en cours" pendant, "terminé" après. `endsAt` absent → estimé à +3 h.
 */
export function eventLifecycle(
  startsAt: Date,
  endsAt: Date | null | undefined,
  now = new Date(),
): { phase: EventPhase; secondsToStart: number | null; secondsToEnd: number | null } {
  const estimatedEnd = endsAt ?? new Date(startsAt.getTime() + 3 * 3600_000);
  const toStart = Math.floor((startsAt.getTime() - now.getTime()) / 1000);
  const toEnd = Math.floor((estimatedEnd.getTime() - now.getTime()) / 1000);
  if (toStart > 0) return { phase: "upcoming", secondsToStart: toStart, secondsToEnd: null };
  if (toEnd > 0) return { phase: "ongoing", secondsToStart: null, secondsToEnd: toEnd };
  return { phase: "ended", secondsToStart: null, secondsToEnd: null };
}

export function invitationExpiresAt(from: Date, hours = DEFAULT_INVITATION_TTL_HOURS): Date {
  return new Date(from.getTime() + hours * 3600_000);
}

export function moodExpiresAt(from: Date, hours?: number): Date {
  const h = hours == null || Number.isNaN(hours) ? DEFAULT_MOOD_HOURS : Math.round(hours);
  if (h < 1 || h > MAX_MOOD_HOURS) {
    throw new Error("MOOD_DURATION_INVALID");
  }
  return new Date(from.getTime() + h * 3600_000);
}

export function isMoodActive(expiresAt: Date, now = new Date()): boolean {
  return expiresAt.getTime() > now.getTime();
}

export function resolveInvitationPayer(priceXaf: number, requested?: InvitationPayer | null): InvitationPayer {
  if (priceXaf <= 0) return "FREE";
  if (requested === "HOST" || requested === "GUEST") return requested;
  return "GUEST";
}

export type InviteEligibilityReason =
  | "OK"
  | "INVITE_SELF"
  | "EVENT_NOT_FUTURE"
  | "EVENT_CANCELLED"
  | "EVENT_FULL"
  | "AGE_RESTRICTED"
  | "ALREADY_IN";

export function evaluateInvite(input: {
  inviterId: string;
  inviteeId: string;
  startsAt: Date;
  status: string;
  capacity: number | null;
  taken: number;
  minAge: number | null;
  inviteeBirthDate: Date | null;
  alreadyParticipating: boolean;
  priceXaf: number;
  payer: InvitationPayer;
  now?: Date;
}): InviteEligibilityReason {
  if (input.inviterId === input.inviteeId) return "INVITE_SELF";
  if (input.status === "CANCELLED") return "EVENT_CANCELLED";
  if (!eventIsFuture(input.startsAt, input.now)) return "EVENT_NOT_FUTURE";
  if (input.alreadyParticipating) return "ALREADY_IN";
  if (eventIsFull(input.capacity, input.taken)) return "EVENT_FULL";
  if (!meetsMinAge(input.inviteeBirthDate, input.minAge, input.now)) return "AGE_RESTRICTED";
  void input.payer;
  void input.priceXaf;
  return "OK";
}

export function canAcceptInvitation(input: {
  status: string;
  expiresAt: Date;
  inviteeId: string;
  actorId: string;
  now?: Date;
}): "OK" | "NOT_INVITEE" | "NOT_PENDING" | "INVITE_EXPIRED" {
  if (input.actorId !== input.inviteeId) return "NOT_INVITEE";
  if (input.status !== "PENDING") return "NOT_PENDING";
  if (input.expiresAt.getTime() <= (input.now ?? new Date()).getTime()) return "INVITE_EXPIRED";
  return "OK";
}
