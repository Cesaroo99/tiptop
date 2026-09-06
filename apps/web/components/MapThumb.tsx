"use client";

import { ZONE_COORDS } from "@/lib/time";
import { PinIcon } from "./Icons";

export function MapThumb({
  city,
  zone,
  lat,
  lng,
  className = "",
}: {
  city?: string | null;
  zone?: string | null;
  lat?: number | null;
  lng?: number | null;
  className?: string;
}) {
  const fromZone = (zone && ZONE_COORDS[zone]) || null;
  const point =
    lat != null && lng != null && Number.isFinite(lat) && Number.isFinite(lng)
      ? { lat, lng }
      : fromZone || ZONE_COORDS["Carrefour Damas"];
  const zoom = lat != null && lng != null ? 16 : 14;
  const src = `https://staticmap.openstreetmap.de/staticmap.php?center=${point.lat},${point.lng}&zoom=${zoom}&size=240x180&maptype=mapnik`;
  return (
    <div className={`relative overflow-hidden rounded-xl border-[3px] border-yellow bg-accent-soft shadow-sm ${className}`}>
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-accent">
        <PinIcon size={18} />
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={zone ? `${city ?? ""} ${zone}` : city ?? ""}
        className="relative z-[1] h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}
