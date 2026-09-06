"use client";

import { cityCoords } from "@tiptop/domain";
import { ZONE_COORDS } from "@/lib/time";
import { PinIcon } from "./Icons";

function lon2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}

function lat2tile(lat: number, zoom: number) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** zoom);
}

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
      : fromZone || cityCoords(city) || ZONE_COORDS["Carrefour Damas"];
  const zoom = lat != null && lng != null ? 16 : 14;
  const tile = `https://tile.openstreetmap.org/${zoom}/${lon2tile(point.lng, zoom)}/${lat2tile(point.lat, zoom)}.png`;
  return (
    <div className={`relative overflow-hidden rounded-xl border-[3px] border-yellow bg-accent-soft shadow-sm ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={tile}
        alt={zone ? `${city ?? ""} ${zone}` : city ?? ""}
        className="h-full w-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span className="pointer-events-none absolute inset-0 grid place-items-center text-accent drop-shadow-sm">
        <PinIcon size={18} />
      </span>
    </div>
  );
}
