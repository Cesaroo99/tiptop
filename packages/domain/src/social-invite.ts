/**
 * Invitation sociale = pont vers une expérience réelle, hors billetterie événement.
 *
 * Distincte de `Invitation` (événement + paiement) : ici on invite quelqu'un
 * à un restaurant, un café, une activité, à nous rejoindre, ou autour d'une envie.
 * Accepter ouvre une conversation directe — jamais un paiement obligatoire.
 */

export type SocialInviteContext = "RESTAURANT" | "CAFE" | "ACTIVITY" | "MEETUP" | "WISH";

export type SocialInviteStatus = "SENT" | "ACCEPTED" | "REFUSED" | "EXPIRED" | "CANCELLED";

export const SOCIAL_INVITE_TTL_HOURS = 72;

export function socialInviteExpiresAt(from: Date, hours = SOCIAL_INVITE_TTL_HOURS): Date {
  return new Date(from.getTime() + hours * 3600_000);
}

const CTA_LABELS: Record<SocialInviteContext, { fr: string; en: string }> = {
  RESTAURANT: { fr: "Inviter au restaurant", en: "Invite to a restaurant" },
  CAFE: { fr: "Inviter à prendre un café", en: "Invite for a coffee" },
  ACTIVITY: { fr: "Proposer cette activité", en: "Propose this activity" },
  MEETUP: { fr: "Inviter à me rejoindre", en: "Invite to join me" },
  WISH: { fr: "Je t’invite", en: "I’ll take you" },
};

export function socialInviteCtaLabel(context: SocialInviteContext, locale: "fr" | "en" = "fr"): string {
  return CTA_LABELS[context][locale];
}

export function assertSocialInviteTarget(actorId: string, inviteeId: string): "OK" | "INVITE_SELF" {
  return actorId === inviteeId ? "INVITE_SELF" : "OK";
}

export type SocialInviteRespondReason = "OK" | "NOT_INVITEE" | "NOT_PENDING" | "EXPIRED";

export function canRespondSocialInvite(input: {
  status: SocialInviteStatus;
  expiresAt: Date;
  inviteeId: string;
  actorId: string;
  now?: Date;
}): SocialInviteRespondReason {
  if (input.actorId !== input.inviteeId) return "NOT_INVITEE";
  if (input.status !== "SENT") return "NOT_PENDING";
  if (input.expiresAt.getTime() <= (input.now ?? new Date()).getTime()) return "EXPIRED";
  return "OK";
}

/** Anti-spam (#56) : un envoi raisonnable par jour, pas de doublon en attente vers la même personne. */
export const SOCIAL_INVITE_DAILY_LIMIT = 20;

export function canSendSocialInvite(input: {
  sentTodayCount: number;
  hasPendingToSameInvitee: boolean;
}): "OK" | "RATE_LIMITED" | "ALREADY_PENDING" {
  if (input.hasPendingToSameInvitee) return "ALREADY_PENDING";
  if (input.sentTodayCount >= SOCIAL_INVITE_DAILY_LIMIT) return "RATE_LIMITED";
  return "OK";
}
