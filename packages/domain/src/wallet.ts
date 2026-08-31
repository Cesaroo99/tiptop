/** Packs de likes mock + crédit du ledger unités (D17). Jamais de mélange XAF / likes. */

export type LikePack = {
  code: string;
  units: number;
  amountXaf: number;
};

export const LIKE_PACKS: readonly LikePack[] = [
  { code: "p1", units: 1, amountXaf: 500 },
  { code: "p5", units: 5, amountXaf: 2000 },
  { code: "p20", units: 20, amountXaf: 7000 },
];

export function getLikePack(code: string): LikePack {
  const pack = LIKE_PACKS.find((p) => p.code === code);
  if (!pack) throw new Error("LIKE_PACK_INVALID");
  return pack;
}

export function likeCreditAllowed(
  paymentStatus: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED",
  alreadyCredited: boolean,
): { ok: true } | { ok: false; reason: "LIKE_ALREADY_CREDITED" | "PAYMENT_NOT_SUCCEEDED" } {
  if (alreadyCredited) return { ok: false, reason: "LIKE_ALREADY_CREDITED" };
  if (paymentStatus !== "SUCCEEDED") return { ok: false, reason: "PAYMENT_NOT_SUCCEEDED" };
  return { ok: true };
}

export function needsLikePurchase(totalUnits: number): boolean {
  return totalUnits <= 0;
}
