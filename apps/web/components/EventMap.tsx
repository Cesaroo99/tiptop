"use client";

import { cityCoords, mapsDirectionsUrl, osmEmbedUrl } from "@tiptop/domain";
import { ZONE_COORDS } from "@/lib/time";
import { useI18n } from "@/lib/i18n";
import { PinIcon } from "./Icons";

export function resolveEventPoint(input: {
  city?: string | null;
  zone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): { lat: number; lng: number } | null {
  if (input.latitude != null && input.longitude != null && Number.isFinite(input.latitude) && Number.isFinite(input.longitude)) {
    return { lat: input.latitude, lng: input.longitude };
  }
  if (input.zone && ZONE_COORDS[input.zone]) return ZONE_COORDS[input.zone];
  return cityCoords(input.city);
}

export function EventMap({
  city,
  zone,
  venue,
  address,
  latitude,
  longitude,
  className = "",
}: {
  city?: string | null;
  zone?: string | null;
  venue?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}) {
  const { messages } = useI18n();
  const point = resolveEventPoint({ city, zone, latitude, longitude });
  const mapsUrl = mapsDirectionsUrl({
    city,
    zone,
    placeName: venue,
    address,
    latitude: point?.lat,
    longitude: point?.lng,
  });
  if (!point && !mapsUrl) return null;
  const label = [venue, address, zone, city].filter(Boolean).join(" · ");

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-surface-sunken ${className}`}>
      {point ? (
        <iframe
          title={label || messages.world.moodOpenMap}
          src={osmEmbedUrl(point.lat, point.lng)}
          className="h-48 w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : null}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="type-caption inline-flex min-w-0 items-center gap-1.5 text-muted">
          <PinIcon size={13} />
          <span className="truncate">{label}</span>
        </p>
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="type-caption shrink-0 font-semibold text-accent"
          >
            {messages.world.moodDirections}
          </a>
        ) : null}
      </div>
    </div>
  );
}
