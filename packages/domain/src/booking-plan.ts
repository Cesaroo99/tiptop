/** Qui paie, quand la place est calée, et si on attend l’acceptation. */

export const EVENT_PAYMENT_RULES = ["HOLD", "PAY_FIRST", "PAY_REQUIRED"] as const;
export type EventPaymentRule = (typeof EVENT_PAYMENT_RULES)[number];

export const BOOKING_INTENTS = ["PAY_NOW", "WAIT_ACCEPT", "GUEST_PAYS"] as const;
export type BookingIntent = (typeof BOOKING_INTENTS)[number];

export function normalizePaymentRule(raw?: string | null): EventPaymentRule {
  if (raw === "PAY_FIRST" || raw === "PAY_REQUIRED") return raw;
  return "HOLD";
}

export function normalizeBookingIntent(raw?: string | null): BookingIntent | null {
  if (raw === "WAIT_ACCEPT" || raw === "GUEST_PAYS" || raw === "PAY_NOW") return raw;
  return null;
}

export function allowedBookingIntents(input: {
  price: number;
  paymentRule?: string | null;
}): BookingIntent[] {
  const free = input.price <= 0;
  const rule = normalizePaymentRule(input.paymentRule);
  if (free) return ["PAY_NOW", "WAIT_ACCEPT"];
  if (rule === "PAY_REQUIRED") return ["PAY_NOW", "GUEST_PAYS"];
  return ["PAY_NOW", "WAIT_ACCEPT", "GUEST_PAYS"];
}

export type EventBookingPlan = {
  intent: BookingIntent;
  paymentRule: EventPaymentRule;
  holdCapacity: boolean;
  holdOnInvite: boolean;
  reservationStatus: "CONFIRMED" | "AWAITING_PAYMENT" | "DRAFT";
  ticketStatus: "CONFIRMED" | "AWAITING_PAYMENT" | "DRAFT";
  needsPayment: boolean;
  sendInvites: boolean;
  invitePayer: "HOST" | "GUEST" | "FREE";
  payAfterAccept: boolean;
  bookSelfNow: boolean;
  includeGuestsInReservation: boolean;
};

export function planEventBooking(input: {
  price: number;
  paymentRule?: string | null;
  includeSelf: boolean;
  pickedCount: number;
  intent?: string | null;
}): EventBookingPlan {
  const paymentRule = normalizePaymentRule(input.paymentRule);
  const picked = input.pickedCount > 0;
  const requested = normalizeBookingIntent(input.intent);
  const allowed = allowedBookingIntents({ price: input.price, paymentRule });
  const free = input.price <= 0;

  if (free) {
    const intent: BookingIntent = picked && requested === "WAIT_ACCEPT" ? "WAIT_ACCEPT" : "PAY_NOW";
    return {
      intent,
      paymentRule,
      holdCapacity: true,
      holdOnInvite: false,
      reservationStatus: "CONFIRMED",
      ticketStatus: "CONFIRMED",
      needsPayment: false,
      sendInvites: picked && intent === "WAIT_ACCEPT",
      invitePayer: "FREE",
      payAfterAccept: false,
      bookSelfNow: input.includeSelf,
      includeGuestsInReservation: picked && intent === "PAY_NOW",
    };
  }

  const intent: BookingIntent =
    picked && requested && allowed.includes(requested) ? requested : "PAY_NOW";
  const holdCapacity = paymentRule === "HOLD";
  const unpaidStatus = holdCapacity ? "AWAITING_PAYMENT" : "DRAFT";
  const sendInvites = picked && intent !== "PAY_NOW";
  const includeGuestsInReservation = picked && intent === "PAY_NOW";
  const bookSelfNow = input.includeSelf || includeGuestsInReservation;
  const holdOnInvite = holdCapacity && intent === "WAIT_ACCEPT";

  return {
    intent,
    paymentRule,
    holdCapacity,
    holdOnInvite,
    reservationStatus: unpaidStatus,
    ticketStatus: unpaidStatus,
    needsPayment: bookSelfNow || includeGuestsInReservation,
    sendInvites,
    invitePayer: intent === "GUEST_PAYS" ? "GUEST" : "HOST",
    payAfterAccept: intent === "WAIT_ACCEPT",
    bookSelfNow,
    includeGuestsInReservation,
  };
}

export function unpaidReservationNeedsPay(status: string, amount: number) {
  return amount > 0 && (status === "AWAITING_PAYMENT" || status === "DRAFT");
}
