/** Paiement mock — aucun vrai argent (D25). */

export type PaymentProviderKind = "CARD" | "ORANGE_MONEY" | "MTN_MOMO";
export type PaymentStatusKind = "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED";

export const PAYMENT_PROVIDERS: PaymentProviderKind[] = ["CARD", "ORANGE_MONEY", "MTN_MOMO"];

/** Défaut phase initiale. Ne pas recopier `0` dans les écrans : lire cette constante ou AppConfig. */
export const TIPTOP_PLATFORM_FEE_PERCENT = 0;
export const PLATFORM_FEE_CONFIG_KEY = "platformFeePercent";

export function reservationAmountXaf(priceXaf: number, seats: number): number {
  const n = Math.max(1, Math.round(seats));
  return Math.max(0, Math.round(priceXaf)) * n;
}

export function normalizePlatformFeePercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) return TIPTOP_PLATFORM_FEE_PERCENT;
  return Math.round(n * 100) / 100;
}

export function platformFeeXaf(
  ticketAmountXaf: number,
  feePercent: number = TIPTOP_PLATFORM_FEE_PERCENT,
): number {
  const ticket = Math.max(0, Math.round(ticketAmountXaf));
  const percent = normalizePlatformFeePercent(feePercent);
  return Math.round((ticket * percent) / 100);
}

export type ChargeBreakdown = {
  ticketAmountXaf: number;
  platformFeePercent: number;
  platformFeeXaf: number;
  providerFeeXaf: number;
  chargeTotalXaf: number;
  organizerNetXaf: number;
};

/**
 * Prix billet (acheteur) ≠ commission TipTop (organisateur) ≠ frais PSP.
 * À 0 % le total acheteur = le prix du billet.
 */
export function chargeBreakdown(input: {
  ticketAmountXaf: number;
  platformFeePercent?: number;
  providerFeeXaf?: number;
}): ChargeBreakdown {
  const ticketAmountXaf = Math.max(0, Math.round(input.ticketAmountXaf));
  const platformFeePercent = normalizePlatformFeePercent(
    input.platformFeePercent ?? TIPTOP_PLATFORM_FEE_PERCENT,
  );
  const providerFeeXaf = Math.max(0, Math.round(input.providerFeeXaf ?? 0));
  const fee = platformFeeXaf(ticketAmountXaf, platformFeePercent);
  return {
    ticketAmountXaf,
    platformFeePercent,
    platformFeeXaf: fee,
    providerFeeXaf,
    chargeTotalXaf: ticketAmountXaf,
    organizerNetXaf: Math.max(0, ticketAmountXaf - fee - providerFeeXaf),
  };
}

/** Prod : secret obligatoire. Dev/test : ouvert seulement si aucun secret n’est configuré. */
export function webhookRequestAllowed(input: {
  providedSecret?: string;
  configuredSecret?: string;
  nodeEnv: string;
}): boolean {
  const configured = input.configuredSecret?.trim() ?? "";
  const provided = input.providedSecret ?? "";
  if (configured) return provided === configured;
  return input.nodeEnv !== "production";
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
