/** Catalogue des événements produit mesurables (lancement). Pas un produit IA. */

export const ANALYTICS_EVENTS = [
  "auth.signup",
  "auth.login",
  "app.open",
  "session.end",
  "post.create",
  "post.view",
  "content.ignore",
  "mood.create",
  "mood.view",
  "mood.watch",
  "like.place",
  "like.receive",
  "profile.view",
  "follow.create",
  "friend.accept",
  "message.send",
  "event.create",
  "event.view",
  "event.save",
  "event.join",
  "reservation.create",
  "payment.succeed",
  "invite.send",
  "invite.accept",
  "availability.set",
  "ticket.checkin",
  "notification.open",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export function isAnalyticsEvent(name: string): name is AnalyticsEventName {
  return (ANALYTICS_EVENTS as readonly string[]).includes(name);
}
