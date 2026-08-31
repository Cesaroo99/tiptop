import { describe, expect, it } from "vitest";
import { maskPhone, parsePhone } from "../src/phone";
import { canResendOtp, evaluateOtp } from "../src/otp";
import { availableBalance, displayLikeRatio, pickUnitForLike, planHeartTransfer, planTransfer } from "../src/likes";

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
