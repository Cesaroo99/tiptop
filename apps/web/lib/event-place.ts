import { formatApproxDistance, haversineKm } from "@tiptop/domain";
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
