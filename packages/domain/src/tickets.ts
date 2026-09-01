/** Tickets, QR HMAC, fenêtre d’entrée, consommation atomique (D24). */

export type TicketStatus =
  | "DRAFT"
  | "AWAITING_PAYMENT"
  | "CONFIRMED"
  | "CONSUMED"
  | "CANCELLED"
  | "REFUNDED"
  | "EXPIRED"
  | "INVALID";

export const ENTRY_OPEN_BEFORE_MS = 2 * 3600_000;
export const ENTRY_FALLBACK_AFTER_MS = 8 * 3600_000;
export const QR_TTL_SECONDS = 15 * 60;

export function isInEntryWindow(input: {
  startsAt: Date;
  endsAt: Date | null;
  now?: Date;
}): boolean {
  const now = (input.now ?? new Date()).getTime();
  const open = input.startsAt.getTime() - ENTRY_OPEN_BEFORE_MS;
  const close = input.endsAt
    ? input.endsAt.getTime()
    : input.startsAt.getTime() + ENTRY_FALLBACK_AFTER_MS;
  return now >= open && now <= close;
}

export function canShowQr(input: {
  status: TicketStatus;
  startsAt: Date;
  endsAt: Date | null;
  now?: Date;
}): boolean {
  return input.status === "CONFIRMED" && isInEntryWindow(input);
}

export function canConsumeTicket(status: TicketStatus, consumedAt: Date | null): "OK" | "ALREADY_CONSUMED" | "NOT_CONFIRMED" {
  if (consumedAt || status === "CONSUMED") return "ALREADY_CONSUMED";
  if (status !== "CONFIRMED") return "NOT_CONFIRMED";
  return "OK";
}

export function signTicketQr(ticketId: string, exp: number, hmacHex: string): string {
  return `tt1.${ticketId}.${exp}.${hmacHex.slice(0, 16)}`;
}

export function parseTicketQr(token: string): { ticketId: string; exp: number; sig: string } | null {
  const parts = token.trim().split(".");
  if (parts.length !== 4 || parts[0] !== "tt1") return null;
  const exp = Number(parts[2]);
  if (!parts[1] || !Number.isFinite(exp)) return null;
  return { ticketId: parts[1], exp, sig: parts[3] };
}

export function verifyTicketQr(input: {
  token: string;
  expectedSig: string;
  nowSeconds?: number;
}): { ok: true; ticketId: string } | { ok: false; reason: "INVALID" | "EXPIRED" | "HMAC" } {
  const parsed = parseTicketQr(input.token);
  if (!parsed) return { ok: false, reason: "INVALID" };
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (parsed.exp < now) return { ok: false, reason: "EXPIRED" };
  if (parsed.sig !== input.expectedSig.slice(0, 16)) return { ok: false, reason: "HMAC" };
  return { ok: true, ticketId: parsed.ticketId };
}

export function qrExpiry(from = new Date(), ttlSeconds = QR_TTL_SECONDS): number {
  return Math.floor(from.getTime() / 1000) + ttlSeconds;
}
