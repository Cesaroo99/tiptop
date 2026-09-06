/** Avis post-événement (G22 / D29) — pures. */

export const REVIEW_DELAY_HOURS = 24;
export const REVIEW_MAX_CHARS = 500;
export const DEFAULT_EVENT_DURATION_HOURS = 4;

export function eventEndedAt(startsAt: Date, endsAt: Date | null | undefined): Date {
  return endsAt ?? new Date(startsAt.getTime() + DEFAULT_EVENT_DURATION_HOURS * 3600_000);
}

export function reviewOpensAt(endedAt: Date, delayHours = REVIEW_DELAY_HOURS): Date {
  return new Date(endedAt.getTime() + delayHours * 3600_000);
}

export type ReviewGate =
  | "OK"
  | "HOST"
  | "NOT_ATTENDED"
  | "TOO_EARLY"
  | "ALREADY"
  | "EVENT_CANCELLED";

export function canLeaveReview(input: {
  isHost: boolean;
  attended: boolean;
  alreadyReviewed: boolean;
  eventStatus: string;
  opensAt: Date;
  now?: Date;
}): ReviewGate {
  if (input.eventStatus === "CANCELLED") return "EVENT_CANCELLED";
  if (input.isHost) return "HOST";
  if (!input.attended) return "NOT_ATTENDED";
  if (input.alreadyReviewed) return "ALREADY";
  if ((input.now ?? new Date()).getTime() < input.opensAt.getTime()) return "TOO_EARLY";
  return "OK";
}

export function assertReviewBody(body: string): string {
  const t = body.trim();
  if (!t) throw new Error("REVIEW_BODY_REQUIRED");
  if (t.length > REVIEW_MAX_CHARS) throw new Error("REVIEW_BODY_TOO_LONG");
  return t;
}

export function assertReviewRating(rating: number | null | undefined): number | null {
  if (rating == null) return null;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("REVIEW_RATING_INVALID");
  return rating;
}
