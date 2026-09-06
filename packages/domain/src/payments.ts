/** Paiement mock — aucun vrai argent (D25). */

export type PaymentProviderKind = "CARD" | "ORANGE_MONEY" | "MTN_MOMO";
export type PaymentStatusKind = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export const PAYMENT_PROVIDERS: PaymentProviderKind[] = ["CARD", "ORANGE_MONEY", "MTN_MOMO"];

export function reservationAmountXaf(priceXaf: number, seats: number): number {
  const n = Math.max(1, Math.round(seats));
  return Math.max(0, Math.round(priceXaf)) * n;
}

export function mockCharge(input: {
  provider: PaymentProviderKind;
  fail?: boolean;
}): { status: "SUCCEEDED" | "FAILED" } {
  if (!PAYMENT_PROVIDERS.includes(input.provider)) {
    throw new Error("PAYMENT_PROVIDER_INVALID");
  }
  return { status: input.fail ? "FAILED" : "SUCCEEDED" };
}

export function applyWebhook(existingStatus: PaymentStatusKind, next: "SUCCEEDED" | "FAILED"): {
  applied: boolean;
  status: PaymentStatusKind;
} {
  if (existingStatus === "SUCCEEDED" || existingStatus === "FAILED" || existingStatus === "CANCELLED") {
    return { applied: false, status: existingStatus };
  }
  return { applied: true, status: next };
}
