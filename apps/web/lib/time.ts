export function formatRelative(
  iso: string,
  labels: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string },
) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.round(diff / 60_000));
  if (min < 2) return labels.justNow;
  if (min < 60) return labels.minutesAgo.replace("{n}", String(min));
  const hours = Math.round(min / 60);
  if (hours < 24) return labels.hoursAgo.replace("{n}", String(hours));
  const days = Math.round(hours / 24);
  return labels.daysAgo.replace("{n}", String(days));
}

export function dateLocale(locale: string) {
  return locale === "en" ? "en-GB" : "fr-FR";
}

export function formatFcfa(amount: number) {
  const n = Math.max(0, Math.round(amount));
  return `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} FCFA`;
}

export function formatEventDateBadge(iso: string, locale: string) {
  const raw = new Date(iso).toLocaleDateString(dateLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return raw.replace(/(^|\s)\S/g, (ch) => ch.toUpperCase());
}

export function formatEventWhen(iso: string, locale: string) {
  return new Date(iso).toLocaleString(dateLocale(locale), {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateTime(iso: string, locale: string) {
  return new Date(iso).toLocaleString(dateLocale(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function eventCountdown(startsAt: string) {
  const ms = new Date(startsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const min = Math.round(ms / 60_000);
  if (min < 60) return { unit: "min" as const, value: Math.max(1, min) };
  const hours = Math.round(min / 60);
  if (hours < 48) return { unit: "h" as const, value: hours };
  return { unit: "d" as const, value: Math.round(hours / 24) };
}

export function formatCountdownLabel(startsAt: string) {
  const countdown = eventCountdown(startsAt);
  if (!countdown) return null;
  if (countdown.unit === "min") return `${countdown.value}min`;
  if (countdown.unit === "h") return `${countdown.value}h`;
  return `${countdown.value}j`;
}

/** 3400 → « 3.4k », comme la ligne de stats de la maquette accueil. */
export function formatCompactCount(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${rounded}k`;
  }
  const m = n / 1_000_000;
  const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
  return `${rounded}M`;
}

export function splitPostLead(body: string): { lead: string; rest: string } {
  const idx = body.indexOf(":");
  if (idx > 0 && idx < 72) {
    return { lead: body.slice(0, idx + 1).trim(), rest: body.slice(idx + 1).trim() };
  }
  return { lead: "", rest: body };
}

export const ZONE_COORDS: Record<string, { lat: number; lng: number }> = {
  "Carrefour Damas": { lat: 3.848, lng: 11.502 },
  Bastos: { lat: 3.89, lng: 11.512 },
  Odza: { lat: 3.8, lng: 11.54 },
  Nlongkak: { lat: 3.875, lng: 11.512 },
  "Ngoa-Ekellé": { lat: 3.863, lng: 11.5 },
  Melen: { lat: 3.86, lng: 11.49 },
  Mimboman: { lat: 3.87, lng: 11.55 },
  Essos: { lat: 3.88, lng: 11.54 },
  Omnisports: { lat: 3.87, lng: 11.52 },
  "Mvog-Mbi": { lat: 3.85, lng: 11.52 },
};
