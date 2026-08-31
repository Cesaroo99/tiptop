import { describe, expect, it } from "vitest";
import { maskPhone, parsePhone } from "../src/phone";
import { canResendOtp, evaluateOtp } from "../src/otp";
import { availableBalance, displayLikeRatio, pickUnitForLike, planHeartTransfer, planTransfer } from "../src/likes";
import { availabilityUntil, isCurrentlyAvailable } from "../src/availability";
import { displayLocation, roundDistanceKm } from "../src/location";
import { canAcceptInvitation, evaluateInvite, moodExpiresAt } from "../src/events";
import { canConsumeTicket, canShowQr, isInEntryWindow, signTicketQr, verifyTicketQr } from "../src/tickets";
import { applyWebhook, mockCharge, reservationAmountXaf } from "../src/payments";
import { canSendMessage, canStartDirect, directKey, pairIsBlocked, shouldNotifyOffline } from "../src/chat";

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

  it("préfère une unité libre avant de transférer", () => {
    const plan = pickUnitForLike(
      [
        { id: "busy", ownerId: "c", source: "free", activeAllocationUserId: "alice" },
        { id: "free", ownerId: "c", source: "purchased", activeAllocationUserId: null },
      ],
      "sarah",
      "c",
    );
    expect(plan.unitId).toBe("free");
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
