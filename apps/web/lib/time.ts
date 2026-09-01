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

export function eventCountdown(startsAt: string) {
  const ms = new Date(startsAt).getTime() - Date.now();
  if (ms <= 0) return null;
  const min = Math.round(ms / 60_000);
  if (min < 60) return { unit: "min" as const, value: Math.max(1, min) };
  const hours = Math.round(min / 60);
  if (hours < 48) return { unit: "h" as const, value: hours };
  return { unit: "d" as const, value: Math.round(hours / 24) };
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
