/** Règles événements / invitations / moods — pures. */

export const DEFAULT_INVITATION_TTL_HOURS = 24;
export const MAX_MOOD_HOURS = 24;
export const DEFAULT_MOOD_HOURS = 12;

export type InvitationPayer = "HOST" | "GUEST" | "FREE";

/**
 * Catégories d'âge standardisées pour un événement (#16) : plutôt qu'un champ
 * numérique libre, l'organisateur choisit parmi des seuils reconnaissables.
 * La donnée stockée reste un entier simple (`minAge`) — ces catégories ne
 * sont qu'une présentation cohérente au-dessus, pas un nouveau modèle de
 * données. « -13 » / « -16 » / « -18 » et « 21+ » : seuils d’âge minimum.
 */
export const EVENT_AGE_CATEGORIES = [
  { id: "ALL", minAge: 0, label: "Tout âge" },
  { id: "U13", minAge: 13, label: "-13" },
  { id: "U16", minAge: 16, label: "-16" },
  { id: "U18", minAge: 18, label: "-18" },
  { id: "U21", minAge: 21, label: "21+" },
] as const;

export type EventAgeCategoryId = (typeof EVENT_AGE_CATEGORIES)[number]["id"];

export function ageCategoryFromMinAge(minAge: number | null | undefined): EventAgeCategoryId {
  const value = minAge ?? 0;
  let best: EventAgeCategoryId = "ALL";
  for (const c of EVENT_AGE_CATEGORIES) {
    if (value >= c.minAge) best = c.id;
  }
  return best;
}

export function ageCategoryLabel(minAge: number | null | undefined): string | null {
  if (!minAge) return null;
  const cat = EVENT_AGE_CATEGORIES.find((c) => c.id === ageCategoryFromMinAge(minAge));
  return cat && cat.minAge > 0 ? cat.label : null;
}

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

export type HostPeopleTab = "all" | "interested" | "reserved" | "validated";

export type HostPersonBucket = Exclude<HostPeopleTab, "all">;

/** Classement organisateur : intéressé / réservé / déjà entré. */
export function hostPersonBucket(input: {
  status: string;
  ticketStatus?: string | null;
}): HostPersonBucket {
  if (input.status === "PRESENT" || input.ticketStatus === "CONSUMED") return "validated";
  if (input.status === "INTERESTED") return "interested";
  return "reserved";
}

export function filterHostPeople<T extends { status: string; ticketStatus?: string | null }>(
  people: T[],
  tab: HostPeopleTab,
): T[] {
  if (tab === "all") return people;
  return people.filter((p) => hostPersonBucket(p) === tab);
}

export function hostPeopleCounts(people: Array<{ status: string; ticketStatus?: string | null }>) {
  const interested = people.filter((p) => hostPersonBucket(p) === "interested").length;
  const reserved = people.filter((p) => hostPersonBucket(p) === "reserved").length;
  const validated = people.filter((p) => hostPersonBucket(p) === "validated").length;
  return { all: people.length, interested, reserved, validated };
}

/**
 * Qui apparaît dans « Personnes liées » sur la fiche publique.
 * L’hôte est toujours visible. Les autres seulement s’ils ont accepté
 * (`showOnProfile`). Le viewer se voit lui-même, même masqué — pour
 * pouvoir gérer sa visibilité. L’annulation n’apparaît jamais.
 */
export function isEventParticipationPublic(input: {
  userId: string;
  status: string;
  showOnProfile: boolean;
  viewerId?: string | null;
}): boolean {
  if (input.status === "CANCELLED") return false;
  if (input.status === "HOST") return true;
  if (input.showOnProfile) return true;
  if (input.viewerId && input.userId === input.viewerId) return true;
  return false;
}

/** Places occupées par des invités — l’organisateur ne compte pas. */
export const SEATED_GUEST_STATUSES = ["RESERVED", "CONFIRMED", "PRESENT"] as const;

export function isSeatedGuestStatus(status: string): boolean {
  return (SEATED_GUEST_STATUSES as readonly string[]).includes(status);
}

export function seatedGuestCount(participants: Array<{ status: string }>): number {
  return participants.filter((p) => isSeatedGuestStatus(p.status)).length;
}

export function remainingSeats(capacity: number | null | undefined, taken: number): number | null {
  if (capacity == null || capacity <= 0) return null;
  return Math.max(0, capacity - Math.max(0, taken));
}

export function eventIsFull(capacity: number | null | undefined, taken: number): boolean {
  if (capacity == null || capacity <= 0) return false;
  return taken >= capacity;
}

export function eventIsFuture(startsAt: Date, now = new Date()): boolean {
  return startsAt.getTime() > now.getTime();
}

export type EventPhase = "upcoming" | "startingSoon" | "ongoing" | "ended" | "cancelled";

export const STARTING_SOON_WINDOW_SECONDS = 30 * 60;

/**
 * Cycle de vie d'un événement pour l'affichage (#7-8) : compte à rebours avant,
 * "bientôt" dans la dernière demi-heure, "en cours" pendant, "terminé" après,
 * "annulé" prioritaire sur tout le reste. `endsAt` absent → estimé à +3 h.
 *
 * Détermine aussi les actions pertinentes par phase (#14) — la liste exacte
 * des CTA reste décidée côté UI (canBook/isHost/etc.), mais la phase seule
 * doit déjà exclure les actions de réservation une fois l'événement annulé,
 * en cours ou terminé.
 */
export function eventLifecycle(
  startsAt: Date,
  endsAt: Date | null | undefined,
  now = new Date(),
  status: string = "PUBLISHED",
): { phase: EventPhase; secondsToStart: number | null; secondsToEnd: number | null } {
  if (status === "CANCELLED") {
    return { phase: "cancelled", secondsToStart: null, secondsToEnd: null };
  }
  const estimatedEnd = endsAt ?? new Date(startsAt.getTime() + 3 * 3600_000);
  const toStart = Math.floor((startsAt.getTime() - now.getTime()) / 1000);
  const toEnd = Math.floor((estimatedEnd.getTime() - now.getTime()) / 1000);
  if (toStart > 0) {
    const phase: EventPhase = toStart <= STARTING_SOON_WINDOW_SECONDS ? "startingSoon" : "upcoming";
    return { phase, secondsToStart: toStart, secondsToEnd: null };
  }
  if (toEnd > 0) return { phase: "ongoing", secondsToStart: null, secondsToEnd: toEnd };
  return { phase: "ended", secondsToStart: null, secondsToEnd: null };
}

/** Une interaction de réservation/intérêt n'a de sens que sur un événement ni annulé ni terminé. */
export function canInteractWithEvent(phase: EventPhase): boolean {
  return phase !== "cancelled" && phase !== "ended";
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

/** Anti-spam invitations événement (#56) : même palier que les invitations sociales. */
export const EVENT_INVITE_DAILY_LIMIT = 30;

export function canSendEventInvite(sentTodayCount: number): "OK" | "RATE_LIMITED" {
  return sentTodayCount >= EVENT_INVITE_DAILY_LIMIT ? "RATE_LIMITED" : "OK";
}

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

export const EVENT_RECURRENCES = ["NONE", "DAILY", "WEEKLY", "MONTHLY"] as const;
export type EventRecurrence = (typeof EVENT_RECURRENCES)[number];

export function isEventRecurrence(value: string | null | undefined): value is EventRecurrence {
  return Boolean(value && (EVENT_RECURRENCES as readonly string[]).includes(value));
}

export function occurrenceCount(recurrence: EventRecurrence): number {
  if (recurrence === "DAILY") return 7;
  if (recurrence === "WEEKLY") return 8;
  if (recurrence === "MONTHLY") return 4;
  return 1;
}

export function shiftOccurrence(start: Date, recurrence: EventRecurrence, index: number): Date {
  const next = new Date(start.getTime());
  if (recurrence === "DAILY") next.setDate(next.getDate() + index);
  else if (recurrence === "WEEKLY") next.setDate(next.getDate() + 7 * index);
  else if (recurrence === "MONTHLY") next.setMonth(next.getMonth() + index);
  return next;
}

export function seriesGroupKey(event: { id: string; seriesId?: string | null; recurrence?: string | null }): string {
  if (event.seriesId) return event.seriesId;
  if (event.recurrence && event.recurrence !== "NONE") return event.id;
  return `one:${event.id}`;
}

export function dedupeSeriesOccurrences<
  T extends { id: string; startsAt: Date | string; seriesId?: string | null; recurrence?: string | null },
>(items: T[], now = new Date()): T[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = seriesGroupKey(item);
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  const picked: T[] = [];
  for (const list of groups.values()) {
    const future = list
      .filter((e) => new Date(e.startsAt).getTime() > now.getTime())
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    const fallback = [...list].sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime())[0];
    picked.push(future[0] ?? fallback!);
  }
  return picked.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
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
