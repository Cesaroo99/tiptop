/** Localisation à 4 niveaux (D11). Distance jamais au mètre près. */

export type LocationPrecision = "EXACT" | "ZONE" | "CITY" | "HIDDEN";

export type ZoneCatalogEntry = {
  country: string;
  city: string;
  zone: string;
  latitude: number;
  longitude: number;
};

export const YAOUNDE_ZONES: ZoneCatalogEntry[] = [
  { country: "CM", city: "Yaoundé", zone: "Carrefour Damas", latitude: 3.848, longitude: 11.5021 },
  { country: "CM", city: "Yaoundé", zone: "Bastos", latitude: 3.89, longitude: 11.512 },
  { country: "CM", city: "Yaoundé", zone: "Odza", latitude: 3.8, longitude: 11.54 },
  { country: "CM", city: "Yaoundé", zone: "Mvan", latitude: 3.822, longitude: 11.518 },
  { country: "CM", city: "Yaoundé", zone: "Nlongkak", latitude: 3.875, longitude: 11.516 },
  { country: "CM", city: "Yaoundé", zone: "Mvog-Ada", latitude: 3.86, longitude: 11.528 },
  { country: "CM", city: "Yaoundé", zone: "Essos", latitude: 3.87, longitude: 11.545 },
];

export function findZone(city?: string | null, zone?: string | null): ZoneCatalogEntry | undefined {
  if (!city || !zone) return undefined;
  const c = city.trim().toLowerCase();
  const z = zone.trim().toLowerCase();
  return YAOUNDE_ZONES.find((e) => e.city.toLowerCase() === c && e.zone.toLowerCase() === z);
}

export function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371;
  const dLat = deg(b.latitude - a.latitude);
  const dLon = deg(b.longitude - a.longitude);
  const lat1 = deg(a.latitude);
  const lat2 = deg(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function deg(n: number) {
  return (n * Math.PI) / 180;
}

/** Arrondi au km — jamais de précision métrique. */
export function roundDistanceKm(km: number): number {
  if (!Number.isFinite(km) || km < 0) return 1;
  return Math.max(1, Math.round(km));
}

/**
 * Libellé approximatif : seaux de 100 m sous 1 km, puis km entiers.
 * Ne jamais afficher une position GPS.
 */
export function formatApproxDistance(km: number): string {
  if (!Number.isFinite(km) || km < 0) return "1 km";
  if (km < 1) {
    const meters = Math.max(100, Math.round((km * 1000) / 100) * 100);
    if (meters >= 1000) return "1 km";
    return `${meters} m`;
  }
  return `${Math.max(1, Math.round(km))} km`;
}

export function displayLocation(input: {
  precision: LocationPrecision;
  city: string | null;
  zone: string | null;
}): { label: string | null; approximate: boolean; mapGrayed: boolean } {
  switch (input.precision) {
    case "HIDDEN":
      return { label: null, approximate: true, mapGrayed: true };
    case "CITY":
      return { label: input.city, approximate: true, mapGrayed: true };
    case "ZONE":
      return {
        label: [input.city, input.zone].filter(Boolean).join(" - ") || null,
        approximate: true,
        mapGrayed: true,
      };
    case "EXACT":
      return {
        label: [input.city, input.zone].filter(Boolean).join(" - ") || null,
        approximate: false,
        mapGrayed: false,
      };
  }
}

export function publicCoords(
  precision: LocationPrecision,
  latitude: number | null,
  longitude: number | null,
): { latitude: number; longitude: number } | null {
  if (precision === "HIDDEN" || precision === "CITY") return null;
  if (latitude == null || longitude == null) return null;
  if (precision === "ZONE") {
    return { latitude: Math.round(latitude * 100) / 100, longitude: Math.round(longitude * 100) / 100 };
  }
  return { latitude, longitude };
}

/** Lieu optionnel d'un Mood : l'auteur décide de le partager, jamais imposé. */
export type MoodPlaceInput = {
  placeName?: string | null;
  address?: string | null;
  city?: string | null;
  zone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function moodHasPlace(place: MoodPlaceInput): boolean {
  return Boolean(
    place.placeName?.trim() ||
      place.address?.trim() ||
      (place.latitude != null && place.longitude != null) ||
      place.zone?.trim() ||
      place.city?.trim(),
  );
}

/** Libellé court façon TikTok : nom du lieu, sinon premier segment d'adresse, sinon zone. */
export function moodPlaceLabel(place: MoodPlaceInput): string | null {
  const name = place.placeName?.trim();
  if (name) return name;
  const address = place.address?.trim();
  if (address) return address.split(",")[0]?.trim() || address;
  const cityZone = [place.zone, place.city].filter((v) => Boolean(v?.trim())).join(" · ");
  return cityZone || null;
}

export function validateMoodCoords(
  latitude?: number | null,
  longitude?: number | null,
): { latitude: number; longitude: number } | null {
  const hasLat = latitude != null;
  const hasLng = longitude != null;
  if (!hasLat && !hasLng) return null;
  if (!hasLat || !hasLng) throw new Error("MOOD_COORDS_INCOMPLETE");
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("MOOD_COORDS_INVALID");
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error("MOOD_COORDS_INVALID");
  }
  return { latitude, longitude };
}

export function mapsDirectionsUrl(place: MoodPlaceInput): string | null {
  if (place.latitude != null && place.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`;
  }
  const q =
    place.address?.trim() ||
    place.placeName?.trim() ||
    [place.zone, place.city].filter(Boolean).join(", ");
  if (!q) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

export function osmBrowseUrl(place: MoodPlaceInput): string | null {
  if (place.latitude != null && place.longitude != null) {
    return `https://www.openstreetmap.org/?mlat=${place.latitude}&mlon=${place.longitude}#map=16/${place.latitude}/${place.longitude}`;
  }
  return null;
}

/** Zone catalogue la plus proche, si on est encore dans un rayon raisonnable. */
export function nearestZone(
  latitude: number,
  longitude: number,
  maxKm = 25,
): ZoneCatalogEntry | undefined {
  let best: { entry: ZoneCatalogEntry; km: number } | undefined;
  for (const entry of YAOUNDE_ZONES) {
    const km = haversineKm({ latitude, longitude }, entry);
    if (!best || km < best.km) best = { entry, km };
  }
  if (!best || best.km > maxKm) return undefined;
  return best.entry;
}
