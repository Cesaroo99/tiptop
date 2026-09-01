import { describe, expect, it } from "vitest";
import { maskPhone, parsePhone } from "../src/phone";
import { canResendOtp, evaluateOtp } from "../src/otp";
import { availableBalance, displayLikeRatio, likeProduction, pickUnitForLike, planHeartTransfer, planTransfer } from "../src/likes";
import { getLikePack, likeCreditAllowed, LIKE_PACKS, needsLikePurchase } from "../src/wallet";
import { availabilityUntil, isCurrentlyAvailable } from "../src/availability";
import { displayLocation, formatApproxDistance, roundDistanceKm } from "../src/location";
import { canAcceptInvitation, evaluateInvite, moodExpiresAt } from "../src/events";
import { canConsumeTicket, canShowQr, isInEntryWindow, signTicketQr, verifyTicketQr } from "../src/tickets";
import { applyWebhook, mockCharge, reservationAmountXaf } from "../src/payments";
import { canSendMessage, canStartDirect, directKey, pairIsBlocked, shouldNotifyOffline } from "../src/chat";
import {
  assertNotSelf,
  canAccessAdmin,
  canRefundPayments,
  isValidReportReason,
  likeAnomalyFlags,
  refundAllowed,
} from "../src/admin";
import { assertReviewBody, canLeaveReview, reviewOpensAt, eventEndedAt } from "../src/reviews";

describe("parsePhone", () => {
  it("accepte un numéro camerounais national", () => {
    expect(parsePhone("695214785")).toEqual({
      ok: true,
      e164: "+237695214785",
      country: "CM",
      national: "695214785",
    });
  });

  it("accepte un E.164 +237", () => {
    expect(parsePhone("+237 695 21 47 85").ok).toBe(true);
  });

  it("rejette un numéro trop court", () => {
    expect(parsePhone("123")).toEqual({ ok: false, error: "invalid" });
  });
});

describe("maskPhone", () => {
  it("masque le milieu", () => {
    expect(maskPhone("+237695214785")).toMatch(/\*\*\*/);
  });
});

describe("OTP", () => {
  const hash = "abc";
  const future = new Date(Date.now() + 60_000);

  it("valide un code correct", () => {
    expect(
      evaluateOtp({
        expectedHash: hash,
        providedHash: hash,
        expiresAt: future,
        consumedAt: null,
        attempts: 0,
      }),
    ).toBe("valid");
  });

  it("expire", () => {
    expect(
      evaluateOtp({
        expectedHash: hash,
        providedHash: hash,
        expiresAt: new Date(Date.now() - 1),
        consumedAt: null,
        attempts: 0,
      }),
    ).toBe("expired");
  });

  it("refuse après trop de tentatives", () => {
    expect(
      evaluateOtp({
        expectedHash: hash,
        providedHash: "no",
        expiresAt: future,
        consumedAt: null,
        attempts: 5,
      }),
    ).toBe("locked");
  });

  it("respecte le cooldown de renvoi", () => {
    expect(canResendOtp({ lastSentAt: new Date(), cooldownSeconds: 30 })).toBe(false);
    expect(
      canResendOtp({
        lastSentAt: new Date(Date.now() - 31_000),
        cooldownSeconds: 30,
      }),
    ).toBe(true);
  });
});

describe("likes", () => {
  it("transfère une unité d'Alice vers Sarah", () => {
    const plan = planTransfer(
      {
        id: "u1",
        ownerId: "cesar",
        source: "free",
        activeAllocationUserId: "alice",
      },
      "sarah",
      "cesar",
    );
    expect(plan.fromBeneficiaryId).toBe("alice");
    expect(plan.toBeneficiaryId).toBe("sarah");
  });

  it("interdit le like de soi-même", () => {
    expect(() =>
      planTransfer(
        { id: "u1", ownerId: "cesar", source: "free", activeAllocationUserId: null },
        "cesar",
        "cesar",
      ),
    ).toThrow("LIKE_SELF");
  });

  it("compte le solde disponible", () => {
    expect(
      availableBalance([
        { id: "1", ownerId: "c", source: "free", activeAllocationUserId: "a" },
        { id: "2", ownerId: "c", source: "purchased", activeAllocationUserId: null },
      ]),
    ).toBe(1);
  });

  it("transfère le coup de cœur", () => {
    const plan = planHeartTransfer({ userId: "c", eventId: "e1" }, "c", "e2");
    expect(plan.fromEventId).toBe("e1");
    expect(plan.toEventId).toBe("e2");
  });

  it("préfère une unité libre (achetée) avant de transférer", () => {
    const plan = pickUnitForLike(
      [
        { id: "busy", ownerId: "c", source: "free", activeAllocationUserId: "alice" },
        { id: "bought", ownerId: "c", source: "purchased", activeAllocationUserId: null },
      ],
      "sarah",
      "c",
    );
    expect(plan.unitId).toBe("bought");
    expect(plan.fromBeneficiaryId).toBeNull();
  });

  it("transfère si plus d'unité libre", () => {
    const plan = pickUnitForLike(
      [{ id: "only", ownerId: "c", source: "free", activeAllocationUserId: "alice" }],
      "sarah",
      "c",
    );
    expect(plan.fromBeneficiaryId).toBe("alice");
  });

  it("affiche /seconde au-delà du seuil influenceur", () => {
    const ratio = displayLikeRatio(120, 50);
    expect(ratio.unit).toBe("second");
    expect(ratio.value).toBeCloseTo(120 / 3600);
    const prod = likeProduction({ active: 8, perHour: 120, perDay: 200, perMonth: 400 });
    expect(prod.ratio.unit).toBe("second");
    expect(prod.active).toBe(8);
  });

  it("expose les packs 1 / 5 / 20", () => {
    expect(LIKE_PACKS.map((p) => p.units)).toEqual([1, 5, 20]);
    expect(getLikePack("p5").amountXaf).toBe(2000);
    expect(() => getLikePack("p99")).toThrow("LIKE_PACK_INVALID");
  });

  it("n’accorde des likes que si le paiement a réussi", () => {
    expect(likeCreditAllowed("FAILED", false).ok).toBe(false);
    expect(likeCreditAllowed("SUCCEEDED", true).ok).toBe(false);
    expect(likeCreditAllowed("SUCCEEDED", false)).toEqual({ ok: true });
    expect(needsLikePurchase(0)).toBe(true);
    expect(needsLikePurchase(2)).toBe(false);
  });
});

describe("disponibilité", () => {
  it("expire après le TTL", () => {
    const from = new Date("2026-08-31T10:00:00Z");
    const until = availabilityUntil(from, 4);
    expect(until.toISOString()).toBe("2026-08-31T14:00:00.000Z");
    expect(
      isCurrentlyAvailable({
        availability: "AVAILABLE",
        availabilityUntil: until,
        now: new Date("2026-08-31T13:59:00Z"),
      }),
    ).toBe(true);
    expect(
      isCurrentlyAvailable({
        availability: "AVAILABLE",
        availabilityUntil: until,
        now: new Date("2026-08-31T14:01:00Z"),
      }),
    ).toBe(false);
  });

  it("ignore un statut busy même avec TTL", () => {
    expect(
      isCurrentlyAvailable({
        availability: "BUSY",
        availabilityUntil: new Date(Date.now() + 3600_000),
      }),
    ).toBe(false);
  });
});

describe("localisation", () => {
  it("n’arrondit jamais au mètre", () => {
    expect(roundDistanceKm(0.14)).toBe(1);
    expect(roundDistanceKm(13.6)).toBe(14);
  });

  it("affiche une distance approximative en seaux (500 m / km)", () => {
    expect(formatApproxDistance(0.48)).toBe("500 m");
    expect(formatApproxDistance(2.2)).toBe("2 km");
  });

  it("masque la position au niveau HIDDEN", () => {
    expect(displayLocation({ precision: "HIDDEN", city: "Yaoundé", zone: "Bastos" }).label).toBeNull();
  });

  it("grise la carte hors EXACT", () => {
    expect(displayLocation({ precision: "ZONE", city: "Yaoundé", zone: "Bastos" }).mapGrayed).toBe(true);
    expect(displayLocation({ precision: "EXACT", city: "Yaoundé", zone: "Bastos" }).mapGrayed).toBe(false);
  });
});

describe("invitations & moods", () => {
  const base = {
    inviterId: "cesar",
    inviteeId: "erica",
    startsAt: new Date(Date.now() + 86400_000),
    status: "PUBLISHED",
    capacity: 10,
    taken: 2,
    minAge: 18,
    inviteeBirthDate: new Date("1996-07-22"),
    alreadyParticipating: false,
    priceXaf: 0,
    payer: "FREE" as const,
  };

  it("interdit de s’inviter soi-même", () => {
    expect(evaluateInvite({ ...base, inviteeId: "cesar" })).toBe("INVITE_SELF");
  });

  it("autorise l’hôte payeur (checkout ensuite)", () => {
    expect(evaluateInvite({ ...base, priceXaf: 2500, payer: "HOST" })).toBe("OK");
  });

  it("refuse un event complet", () => {
    expect(evaluateInvite({ ...base, capacity: 2, taken: 2 })).toBe("EVENT_FULL");
  });

  it("refuse une invitation expirée", () => {
    expect(
      canAcceptInvitation({
        status: "PENDING",
        expiresAt: new Date(Date.now() - 1000),
        inviteeId: "erica",
        actorId: "erica",
      }),
    ).toBe("INVITE_EXPIRED");
  });

  it("limite un mood à 24 h", () => {
    expect(() => moodExpiresAt(new Date(), 48)).toThrow("MOOD_DURATION_INVALID");
    expect(moodExpiresAt(new Date("2026-08-31T00:00:00Z"), 12).toISOString()).toBe(
      "2026-08-31T12:00:00.000Z",
    );
  });
});

describe("tickets & paiement", () => {
  it("signe et vérifie un QR HMAC", () => {
    const token = signTicketQr("t1", 2_000_000_000, "abcdef0123456789ffff");
    const ok = verifyTicketQr({ token, expectedSig: "abcdef0123456789ffff", nowSeconds: 1_700_000_000 });
    expect(ok).toEqual({ ok: true, ticketId: "t1" });
  });

  it("refuse un HMAC invalide ou expiré", () => {
    const token = signTicketQr("t1", 100, "abcdef0123456789");
    expect(verifyTicketQr({ token, expectedSig: "deadbeefdeadbeef", nowSeconds: 50 }).ok).toBe(false);
    expect(verifyTicketQr({ token, expectedSig: "abcdef0123456789", nowSeconds: 101 })).toEqual({
      ok: false,
      reason: "EXPIRED",
    });
  });

  it("n’autorise la conso que si confirmed et jamais consommé", () => {
    expect(canConsumeTicket("CONFIRMED", null)).toBe("OK");
    expect(canConsumeTicket("CONFIRMED", new Date())).toBe("ALREADY_CONSUMED");
    expect(canConsumeTicket("AWAITING_PAYMENT", null)).toBe("NOT_CONFIRMED");
  });

  it("n’affiche le QR que dans la fenêtre d’entrée", () => {
    const startsAt = new Date("2026-08-31T18:00:00Z");
    const endsAt = new Date("2026-08-31T22:00:00Z");
    expect(isInEntryWindow({ startsAt, endsAt, now: new Date("2026-08-31T16:00:00Z") })).toBe(true);
    expect(isInEntryWindow({ startsAt, endsAt, now: new Date("2026-08-31T15:00:00Z") })).toBe(false);
    expect(canShowQr({ status: "CONFIRMED", startsAt, endsAt, now: new Date("2026-08-31T17:00:00Z") })).toBe(true);
    expect(canShowQr({ status: "AWAITING_PAYMENT", startsAt, endsAt, now: new Date("2026-08-31T17:00:00Z") })).toBe(false);
  });

  it("calcule le montant et ignore un webhook dupliqué", () => {
    expect(reservationAmountXaf(2500, 2)).toBe(5000);
    expect(mockCharge({ provider: "CARD" }).status).toBe("SUCCEEDED");
    expect(mockCharge({ provider: "MTN_MOMO", fail: true }).status).toBe("FAILED");
    expect(applyWebhook("SUCCEEDED", "FAILED")).toEqual({ applied: false, status: "SUCCEEDED" });
    expect(applyWebhook("PENDING", "SUCCEEDED")).toEqual({ applied: true, status: "SUCCEEDED" });
  });
});

describe("chat", () => {
  it("interdit un DM avec soi-même et ordonne la clé 1:1", () => {
    expect(canStartDirect("cesar", "cesar")).toBe("CHAT_SELF");
    expect(directKey("b", "a")).toBe("a:b");
    expect(directKey("a", "b")).toBe("a:b");
  });

  it("bloque l’envoi si pas membre, bloqué, ou texte vide", () => {
    expect(canSendMessage({ isMember: false, blocked: false, kind: "TEXT", body: "salut" })).toBe("NOT_MEMBER");
    expect(canSendMessage({ isMember: true, blocked: true, kind: "TEXT", body: "salut" })).toBe("BLOCKED");
    expect(canSendMessage({ isMember: true, blocked: false, kind: "TEXT", body: "  " })).toBe("EMPTY");
    expect(canSendMessage({ isMember: true, blocked: false, kind: "AUDIO" })).toBe("OK");
    expect(pairIsBlocked([{ blockerId: "a", blockedId: "b" }], "b", "a")).toBe(true);
  });

  it("n’envoie pas de push si le destinataire lit le fil", () => {
    expect(shouldNotifyOffline({ viewingThread: true, pushEnabled: true })).toBe(false);
    expect(shouldNotifyOffline({ viewingThread: false, pushEnabled: true })).toBe(true);
    expect(shouldNotifyOffline({ viewingThread: false, pushEnabled: false })).toBe(false);
  });
});

describe("admin", () => {
  it("ouvre le back-office aux staff seulement", () => {
    expect(canAccessAdmin("ADMIN")).toBe(true);
    expect(canAccessAdmin("MODERATOR")).toBe(true);
    expect(canAccessAdmin("USER")).toBe(false);
    expect(canRefundPayments("ADMIN")).toBe(true);
    expect(canRefundPayments("MODERATOR")).toBe(false);
  });

  it("interdit de se bloquer soi-même et un remboursement non réussi", () => {
    expect(() => assertNotSelf("a", "a")).toThrow("ADMIN_SELF");
    assertNotSelf("a", "b");
    expect(() => refundAllowed("FAILED")).toThrow("PAYMENT_NOT_REFUNDABLE");
    refundAllowed("SUCCEEDED");
    expect(isValidReportReason("SPAM")).toBe(true);
    expect(isValidReportReason("xyz")).toBe(false);
  });

  it("signale un pack acheté non utilisé", () => {
    expect(
      likeAnomalyFlags({
        allocationsLastHour: 0,
        totalUnits: 8,
        purchasedUnits: 6,
        allocatedActive: 0,
      }),
    ).toEqual(["UNUSED_PACK"]);
    expect(
      likeAnomalyFlags({
        allocationsLastHour: 8,
        totalUnits: 40,
        purchasedUnits: 0,
        allocatedActive: 1,
      }),
    ).toEqual(["BURST", "HIGH_BALANCE"]);
  });
});

describe("avis post-event", () => {
  const ended = new Date("2026-01-01T20:00:00Z");
  const opens = reviewOpensAt(ended);

  it("ouvre 24 h après la fin", () => {
    expect(opens.getTime() - ended.getTime()).toBe(24 * 3600_000);
    expect(eventEndedAt(new Date("2026-01-01T18:00:00Z"), null).getTime()).toBe(
      new Date("2026-01-01T22:00:00Z").getTime(),
    );
  });

  it("refuse l’hôte, l’absent, le trop tôt et le doublon", () => {
    const base = {
      isHost: false,
      attended: true,
      alreadyReviewed: false,
      eventStatus: "ENDED",
      opensAt: opens,
      now: opens,
    };
    expect(canLeaveReview(base)).toBe("OK");
    expect(canLeaveReview({ ...base, isHost: true })).toBe("HOST");
    expect(canLeaveReview({ ...base, attended: false })).toBe("NOT_ATTENDED");
    expect(canLeaveReview({ ...base, alreadyReviewed: true })).toBe("ALREADY");
    expect(canLeaveReview({ ...base, now: new Date(opens.getTime() - 1) })).toBe("TOO_EARLY");
    expect(canLeaveReview({ ...base, eventStatus: "CANCELLED" })).toBe("EVENT_CANCELLED");
  });

  it("exige un texte", () => {
    expect(() => assertReviewBody("  ")).toThrow("REVIEW_BODY_REQUIRED");
    expect(assertReviewBody("  Super rooftop  ")).toBe("Super rooftop");
  });
});
