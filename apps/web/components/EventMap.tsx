"use client";

import { cityCoords, osmEmbedUrl } from "@tiptop/domain";
import { useEventDestination } from "@/lib/event-destination";
import { eventPlaceLabel, hasExactCoords } from "@/lib/event-place";
import { ZONE_COORDS } from "@/lib/time";
import { useI18n } from "@/lib/i18n";
import { PinIcon } from "./Icons";

/** Point approximatif (distance / pastille). Ne pas l’utiliser comme destination d’itinéraire. */
export function resolveEventPoint(input: {
  city?: string | null;
  zone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): { lat: number; lng: number } | null {
  if (hasExactCoords(input.latitude, input.longitude)) {
    return { lat: input.latitude as number, lng: input.longitude as number };
  }
  if (input.zone && ZONE_COORDS[input.zone]) return ZONE_COORDS[input.zone];
  return cityCoords(input.city) ?? null;
}

export function EventMap({
  city,
  zone,
  venue,
  address,
  latitude,
  longitude,
  compact = false,
  className = "",
  mapsUrl: mapsUrlProp,
  showCta = true,
}: {
  city?: string | null;
  zone?: string | null;
  venue?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  compact?: boolean;
  className?: string;
  mapsUrl?: string | null;
  showCta?: boolean;
}) {
  const { messages } = useI18n();
  const dest = useEventDestination({ city, zone, venue, address, latitude, longitude });
  const mapsUrl = mapsUrlProp ?? dest.mapsUrl;
  const point = dest.point;
  if (!point && !mapsUrl) return null;
  const label = eventPlaceLabel({ venue, address, city, zone }) || [venue, address, zone, city].filter(Boolean).join(" · ");

  return (
    <div className={`overflow-hidden rounded-xl border border-border bg-surface-sunken ${className}`}>
      {point ? (
        <iframe
          title={label || messages.world.moodOpenMap}
          src={osmEmbedUrl(point.lat, point.lng)}
          className={`${compact ? "h-28" : "h-48"} w-full border-0`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : null}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <p className="type-caption inline-flex min-w-0 items-center gap-1.5 text-muted">
          <PinIcon size={13} />
          <span className="truncate">{label}</span>
        </p>
        {showCta && mapsUrl ? (
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
