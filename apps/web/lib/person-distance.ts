import { formatApproxDistance } from "@tiptop/domain";
import { eventDistanceLabel } from "./event-place";

/** Distance d’une personne par rapport à l’origine du visiteur (GPS ou zone choisie). */
export function personDistanceFromMe(
  origin: { latitude: number; longitude: number } | null | undefined,
  person: {
    city?: string | null;
    zone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    distanceKm?: number | null;
    distanceLabel?: string | null;
  },
): string | null {
  const computed = eventDistanceLabel(origin, {
    city: person.city,
    zone: person.zone,
    latitude: person.latitude,
    longitude: person.longitude,
  });
  if (computed) return computed;
  if (person.distanceLabel) return person.distanceLabel;
  if (person.distanceKm != null) return formatApproxDistance(person.distanceKm);
  return null;
}
