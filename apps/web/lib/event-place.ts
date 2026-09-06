import { formatApproxDistance, haversineKm, mapsDirectionsUrl, type MoodPlaceInput } from "@tiptop/domain";
import { resolveEventPoint } from "@/components/EventMap";

export function eventPlaceLabel(input: {
  venue?: string | null;
  address?: string | null;
  city?: string | null;
  zone?: string | null;
}): string {
  if (input.venue?.trim()) {
    const where = [input.zone, input.city].filter(Boolean).join(", ");
    return where ? `${input.venue.trim()}, ${where}` : input.venue.trim();
  }
  if (input.address?.trim()) return input.address.trim();
  return [input.zone, input.city].filter(Boolean).join(", ");
}

export function hasExactCoords(
  latitude?: number | null,
  longitude?: number | null,
): boolean {
  return (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/** Requête de géocodage / recherche carte : adresse réelle, jamais un centroïde inventé. */
export function eventNavQuery(place: {
  venue?: string | null;
  address?: string | null;
  city?: string | null;
  zone?: string | null;
}): string {
  return [place.address, place.venue, place.zone, place.city].filter((v) => Boolean(v?.trim())).join(", ");
}

/**
 * Destination d’itinéraire : coords GPS stockées seulement si elles sont exactes.
 * Sinon adresse / lieu — jamais les coordonnées catalogue d’une zone.
 */
export function eventDirectionsPlace(place: {
  city?: string | null;
  zone?: string | null;
  venue?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): MoodPlaceInput {
  const exact = hasExactCoords(place.latitude, place.longitude);
  return {
    city: place.city,
    zone: place.zone,
    placeName: place.venue,
    address: place.address,
    latitude: exact ? place.latitude : null,
    longitude: exact ? place.longitude : null,
  };
}

export function eventDirectionsUrl(
  place: Parameters<typeof eventDirectionsPlace>[0],
  geocoded?: { lat: number; lng: number } | null,
): string | null {
  const base = eventDirectionsPlace(place);
  return mapsDirectionsUrl({
    ...base,
    latitude: geocoded?.lat ?? base.latitude,
    longitude: geocoded?.lng ?? base.longitude,
  });
}

export function eventDistanceLabel(
  origin: { latitude: number; longitude: number } | null | undefined,
  place: {
    city?: string | null;
    zone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  },
): string | null {
  if (!origin) return null;
  const point = resolveEventPoint(place);
  if (!point) return null;
  return formatApproxDistance(haversineKm(origin, { latitude: point.lat, longitude: point.lng }));
}
