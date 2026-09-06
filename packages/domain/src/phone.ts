/** Numéros E.164 minimaux — v1 Cameroun prioritaire. */

const COUNTRY_DIGITS: Record<string, { length: number; callingCode: string }> = {
  CM: { length: 9, callingCode: "237" },
  FR: { length: 9, callingCode: "33" },
  US: { length: 10, callingCode: "1" },
};

export type PhoneParseResult =
  | { ok: true; e164: string; country: string; national: string }
  | { ok: false; error: "empty" | "invalid" | "unsupported_country" };

export function parsePhone(input: string, country = "CM"): PhoneParseResult {
  const digits = input.replace(/[^\d]/g, "");
  if (!digits) return { ok: false, error: "empty" };

  const spec = COUNTRY_DIGITS[country];
  if (!spec) return { ok: false, error: "unsupported_country" };

  let national = digits;
  if (digits.startsWith(spec.callingCode) && digits.length === spec.callingCode.length + spec.length) {
    national = digits.slice(spec.callingCode.length);
  } else if (digits.startsWith("0") && digits.length === spec.length + 1) {
    national = digits.slice(1);
  }

  if (national.length !== spec.length) {
    return { ok: false, error: "invalid" };
  }

  return {
    ok: true,
    e164: `+${spec.callingCode}${national}`,
    country,
    national,
  };
}

export function maskPhone(e164: string): string {
  const digits = e164.replace(/[^\d]/g, "");
  if (digits.length < 4) return e164;
  const keepStart = digits.slice(0, 3);
  const keepEnd = digits.slice(-2);
  return `+${keepStart} *** *** *${keepEnd}`;
}
