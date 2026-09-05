/** Devises d’affichage et de règlement. Le montant stocké reste dans la devise de l’événement. */

export const CURRENCY_CODES = [
  "CAD",
  "USD",
  "EUR",
  "GBP",
  "CHF",
  "AUD",
  "XAF",
  "XOF",
  "NGN",
  "GHS",
  "MAD",
  "TND",
  "DZD",
  "EGP",
  "ZAR",
  "KES",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "CAD";

export const CURRENCY_DECIMALS: Record<CurrencyCode, number> = {
  CAD: 2,
  USD: 2,
  EUR: 2,
  GBP: 2,
  CHF: 2,
  AUD: 2,
  XAF: 0,
  XOF: 0,
  NGN: 0,
  GHS: 2,
  MAD: 2,
  TND: 3,
  DZD: 2,
  EGP: 2,
  ZAR: 2,
  KES: 2,
};

/** Combien d’unités de cette devise valent 1 CAD — taux indicatifs d’affichage. */
export const UNITS_PER_CAD: Record<CurrencyCode, number> = {
  CAD: 1,
  USD: 0.74,
  EUR: 0.63,
  GBP: 0.54,
  CHF: 0.58,
  AUD: 1.08,
  XAF: 435,
  XOF: 435,
  NGN: 1200,
  GHS: 8.5,
  MAD: 6.8,
  TND: 2.15,
  DZD: 98,
  EGP: 36,
  ZAR: 13.2,
  KES: 96,
};

export const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  CA: "CAD",
  US: "USD",
  FR: "EUR",
  BE: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  PT: "EUR",
  IE: "EUR",
  AT: "EUR",
  LU: "EUR",
  GB: "GBP",
  CH: "CHF",
  AU: "AUD",
  CM: "XAF",
  GA: "XAF",
  CG: "XAF",
  TD: "XAF",
  CF: "XAF",
  GQ: "XAF",
  SN: "XOF",
  CI: "XOF",
  BF: "XOF",
  ML: "XOF",
  NE: "XOF",
  TG: "XOF",
  BJ: "XOF",
  GW: "XOF",
  NG: "NGN",
  GH: "GHS",
  MA: "MAD",
  TN: "TND",
  DZ: "DZD",
  EG: "EGP",
  ZA: "ZAR",
  KE: "KES",
};

export const CURRENCY_OPTIONS: { code: CurrencyCode; labelFr: string; labelEn: string }[] = [
  { code: "CAD", labelFr: "Dollar canadien", labelEn: "Canadian dollar" },
  { code: "USD", labelFr: "Dollar américain", labelEn: "US dollar" },
  { code: "EUR", labelFr: "Euro", labelEn: "Euro" },
  { code: "GBP", labelFr: "Livre sterling", labelEn: "Pound sterling" },
  { code: "CHF", labelFr: "Franc suisse", labelEn: "Swiss franc" },
  { code: "AUD", labelFr: "Dollar australien", labelEn: "Australian dollar" },
  { code: "XAF", labelFr: "Franc CFA (BEAC)", labelEn: "Central African CFA" },
  { code: "XOF", labelFr: "Franc CFA (UEMOA)", labelEn: "West African CFA" },
  { code: "NGN", labelFr: "Naira", labelEn: "Naira" },
  { code: "GHS", labelFr: "Cedi", labelEn: "Cedi" },
  { code: "MAD", labelFr: "Dirham", labelEn: "Dirham" },
  { code: "TND", labelFr: "Dinar tunisien", labelEn: "Tunisian dinar" },
  { code: "DZD", labelFr: "Dinar algérien", labelEn: "Algerian dinar" },
  { code: "EGP", labelFr: "Livre égyptienne", labelEn: "Egyptian pound" },
  { code: "ZAR", labelFr: "Rand", labelEn: "Rand" },
  { code: "KES", labelFr: "Shilling kényan", labelEn: "Kenyan shilling" },
];

export function isCurrency(code: string | null | undefined): code is CurrencyCode {
  return Boolean(code && (CURRENCY_CODES as readonly string[]).includes(code));
}

export function normalizeCurrency(code: string | null | undefined): CurrencyCode {
  return isCurrency(code) ? code : DEFAULT_CURRENCY;
}

export function countryToCurrency(country: string | null | undefined): CurrencyCode | null {
  if (!country) return null;
  return COUNTRY_TO_CURRENCY[country.trim().toUpperCase()] ?? null;
}

export function resolveUserCurrency(
  userCurrency?: string | null,
  country?: string | null,
): CurrencyCode {
  if (isCurrency(userCurrency)) return userCurrency;
  return countryToCurrency(country) ?? DEFAULT_CURRENCY;
}

export function convertAmount(amount: number, from: string, to: string): number {
  const src = normalizeCurrency(from);
  const dst = normalizeCurrency(to);
  if (!Number.isFinite(amount) || amount === 0) return 0;
  if (src === dst) return amount;
  return (amount / UNITS_PER_CAD[src]) * UNITS_PER_CAD[dst];
}

function groupDots(n: number) {
  return String(Math.max(0, Math.round(n))).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function roundMoney(amount: number, currency: CurrencyCode) {
  const decimals = CURRENCY_DECIMALS[currency];
  const f = 10 ** decimals;
  return Math.round(amount * f) / f;
}

export function formatMoney(amount: number, currency: string, locale = "fr"): string {
  const code = normalizeCurrency(currency);
  const rounded = roundMoney(amount, code);
  if (code === "XAF") return `${groupDots(rounded)} FCFA`;
  if (code === "XOF") return `${groupDots(rounded)} F CFA`;
  const intlLocale = locale.startsWith("en") ? "en-CA" : "fr-CA";
  if (code === "CAD") {
    const n = new Intl.NumberFormat(intlLocale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rounded);
    return locale.startsWith("en") ? `CA$${n}` : `${n} $ CA`;
  }
  return new Intl.NumberFormat(intlLocale, { style: "currency", currency: code }).format(rounded);
}

export function formatEventPrice(
  amount: number,
  eventCurrency: string,
  viewerCurrency: string,
  locale = "fr",
) {
  return formatMoney(convertAmount(amount, eventCurrency, viewerCurrency), viewerCurrency, locale);
}
