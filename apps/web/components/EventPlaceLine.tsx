"use client";

import { PinIcon } from "./Icons";
import { eventDistanceLabel, eventPlaceLabel } from "@/lib/event-place";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { useViewerLocation } from "@/lib/viewer-location";

export function EventPlaceLine({
  city,
  zone,
  venue,
  address,
  latitude,
  longitude,
  showDistance = true,
}: {
  city?: string | null;
  zone?: string | null;
  venue?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  showDistance?: boolean;
}) {
  const { messages } = useI18n();
  const { user } = useSession();
  const { origin } = useViewerLocation(user);
  const place = eventPlaceLabel({ venue, address, city, zone });
  const distance = showDistance ? eventDistanceLabel(origin, { city, zone, latitude, longitude }) : null;
  if (!place && !distance) return null;
  return (
    <p className="type-body-sm mt-2 flex flex-col gap-0.5 text-ink">
      {place ? (
        <span className="inline-flex items-center gap-1.5 font-semibold">
          <PinIcon size={14} className="shrink-0 text-accent" />
          <span className="min-w-0 truncate">{place}</span>
        </span>
      ) : null}
      {distance ? (
        <span className="pl-5 font-bold text-accent">
          {distance} {messages.world.fromYou}
        </span>
      ) : null}
    </p>
  );
}
