/** Catalogue des événements produit mesurables (lancement). Pas un produit IA. */

export const ANALYTICS_EVENTS = [
  "auth.signup",
  "auth.login",
  "post.create",
  "post.view",
  "mood.create",
  "mood.view",
  "like.place",
  "profile.view",
  "follow.create",
  "friend.accept",
  "message.send",
  "event.create",
  "reservation.create",
  "payment.succeed",
  "invite.send",
  "availability.set",
  "ticket.checkin",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(name);
}
