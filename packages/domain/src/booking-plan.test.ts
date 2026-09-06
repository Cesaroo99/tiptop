import { describe, expect, it } from "vitest";
import { planEventBooking, seatsClaimedNow } from "./booking-plan";

describe("planEventBooking", () => {
  it("soi seul, payant, HOLD : place tenue, paiement tout de suite", () => {
    const plan = planEventBooking({ price: 5000, includeSelf: true, pickedCount: 0 });
    expect(plan.intent).toBe("PAY_NOW");
    expect(plan.holdCapacity).toBe(true);
    expect(plan.reservationStatus).toBe("AWAITING_PAYMENT");
    expect(plan.needsPayment).toBe(true);
    expect(plan.sendInvites).toBe(false);
    expect(plan.bookSelfNow).toBe(true);
  });

  it("PAY_FIRST : pas de place sans paiement (brouillon, pas de hold)", () => {
    const plan = planEventBooking({
      price: 5000,
      paymentRule: "PAY_FIRST",
      includeSelf: true,
      pickedCount: 0,
    });
    expect(plan.holdCapacity).toBe(false);
    expect(plan.reservationStatus).toBe("DRAFT");
    expect(plan.needsPayment).toBe(true);
  });

  it("attendre l’acceptation : invitations HOST, je paie après, soi calé maintenant", () => {
    const plan = planEventBooking({
      price: 5000,
      includeSelf: true,
      pickedCount: 2,
      intent: "WAIT_ACCEPT",
    });
    expect(plan.sendInvites).toBe(true);
    expect(plan.invitePayer).toBe("HOST");
    expect(plan.payAfterAccept).toBe(true);
    expect(plan.includeGuestsInReservation).toBe(false);
    expect(plan.bookSelfNow).toBe(true);
  });

  it("chacun paie sa place : invitations GUEST", () => {
    const plan = planEventBooking({
      price: 5000,
      includeSelf: true,
      pickedCount: 1,
      intent: "GUEST_PAYS",
    });
    expect(plan.invitePayer).toBe("GUEST");
    expect(plan.payAfterAccept).toBe(false);
    expect(plan.sendInvites).toBe(true);
    expect(plan.includeGuestsInReservation).toBe(false);
  });

  it("PAY_NOW avec amis : leurs places dans la même réservation", () => {
    const plan = planEventBooking({
      price: 5000,
      includeSelf: true,
      pickedCount: 1,
      intent: "PAY_NOW",
    });
    expect(plan.includeGuestsInReservation).toBe(true);
    expect(plan.sendInvites).toBe(false);
  });

  it("gratuit + attendre : invitations FREE, places confirmées pour soi", () => {
    const plan = planEventBooking({
      price: 0,
      includeSelf: true,
      pickedCount: 1,
      intent: "WAIT_ACCEPT",
    });
    expect(plan.invitePayer).toBe("FREE");
    expect(plan.needsPayment).toBe(false);
    expect(plan.sendInvites).toBe(true);
    expect(plan.includeGuestsInReservation).toBe(false);
  });

  it("HOLD + attendre : la place est tenue à l’invitation, paiement après le oui", () => {
    const plan = planEventBooking({
      price: 5000,
      paymentRule: "HOLD",
      includeSelf: false,
      pickedCount: 1,
      intent: "WAIT_ACCEPT",
    });
    expect(plan.holdOnInvite).toBe(true);
    expect(plan.payAfterAccept).toBe(true);
    expect(plan.needsPayment).toBe(false);
    expect(plan.sendInvites).toBe(true);
  });

  it("PAY_FIRST + attendre : invitation sans place tenue", () => {
    const plan = planEventBooking({
      price: 5000,
      paymentRule: "PAY_FIRST",
      includeSelf: false,
      pickedCount: 1,
      intent: "WAIT_ACCEPT",
    });
    expect(plan.holdOnInvite).toBe(false);
    expect(plan.holdCapacity).toBe(false);
    expect(plan.payAfterAccept).toBe(true);
  });

  it("PAY_REQUIRED : on ne peut pas attendre — WAIT_ACCEPT retombe sur PAY_NOW", () => {
    const plan = planEventBooking({
      price: 5000,
      paymentRule: "PAY_REQUIRED",
      includeSelf: true,
      pickedCount: 2,
      intent: "WAIT_ACCEPT",
    });
    expect(plan.intent).toBe("PAY_NOW");
    expect(plan.payAfterAccept).toBe(false);
    expect(plan.includeGuestsInReservation).toBe(true);
    expect(plan.needsPayment).toBe(true);
  });

  it("places calées maintenant : PAY_NOW compte soi + invités, WAIT_ACCEPT+HOLD aussi", () => {
    const payNow = planEventBooking({
      price: 5000,
      includeSelf: true,
      pickedCount: 2,
      intent: "PAY_NOW",
    });
    expect(seatsClaimedNow(payNow, true, 2)).toBe(3);
    const waitHold = planEventBooking({
      price: 5000,
      paymentRule: "HOLD",
      includeSelf: true,
      pickedCount: 2,
      intent: "WAIT_ACCEPT",
    });
    expect(seatsClaimedNow(waitHold, true, 2)).toBe(3);
    const waitFirst = planEventBooking({
      price: 5000,
      paymentRule: "PAY_FIRST",
      includeSelf: true,
      pickedCount: 2,
      intent: "WAIT_ACCEPT",
    });
    expect(seatsClaimedNow(waitFirst, true, 2)).toBe(1);
  });

  it("PAY_REQUIRED : chacun paie reste possible (paiement avant la place)", () => {
    const plan = planEventBooking({
      price: 5000,
      paymentRule: "PAY_REQUIRED",
      includeSelf: true,
      pickedCount: 1,
      intent: "GUEST_PAYS",
    });
    expect(plan.intent).toBe("GUEST_PAYS");
    expect(plan.invitePayer).toBe("GUEST");
  });
});
