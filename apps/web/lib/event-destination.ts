"use client";

import { useEffect, useState } from "react";
import { eventDirectionsUrl, eventNavQuery, hasExactCoords } from "./event-place";

export type EventDestinationPlace = {
  city?: string | null;
  zone?: string | null;
  venue?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type GeoPoint = { lat: number; lng: number };

const geoCache = new Map<string, GeoPoint | null>();
const inflight = new Map<string, Promise<GeoPoint | null>>();

async function geocodeQuery(q: string): Promise<GeoPoint | null> {
  if (geoCache.has(q)) return geoCache.get(q) ?? null;
  const pending = inflight.get(q);
  if (pending) return pending;
  const task = fetch(`/geocode/search?q=${encodeURIComponent(q)}`)
    .then((res) => (res.ok ? res.json() : { items: [] }))
    .then((data: { items?: Array<{ latitude?: number; longitude?: number }> }) => {
      const hit = data.items?.[0];
      const point =
        hit && Number.isFinite(hit.latitude) && Number.isFinite(hit.longitude)
          ? { lat: hit.latitude as number, lng: hit.longitude as number }
          : null;
      geoCache.set(q, point);
      inflight.delete(q);
      return point;
    })
    .catch(() => {
      inflight.delete(q);
      return null;
    });
  inflight.set(q, task);
  return task;
}

/**
 * Destination réelle d’un événement :
 * 1. coordonnées GPS enregistrées ;
 * 2. géocodage de l’adresse / du lieu ;
 * 3. recherche carte sur le texte d’adresse.
 * Ne jamais inventer un point à partir du centroïde de zone.
 */
export function useEventDestination(place: EventDestinationPlace) {
  const exact = hasExactCoords(place.latitude, place.longitude);
  const query = eventNavQuery(place);
  const [geo, setGeo] = useState<GeoPoint | null>(() => (query ? (geoCache.get(query) ?? null) : null));

  useEffect(() => {
    if (exact || !query) return;
    let live = true;
    void geocodeQuery(query).then((point) => {
      if (live) setGeo(point);
    });
    return () => {
      live = false;
    };
  }, [exact, query]);

  const point = exact
    ? { lat: place.latitude as number, lng: place.longitude as number }
    : geo;
  const mapsUrl = eventDirectionsUrl(place, point);

  return { point, mapsUrl, query };
}
