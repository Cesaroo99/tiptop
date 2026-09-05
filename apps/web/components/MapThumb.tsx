"use client";

import { ZONE_COORDS } from "@/lib/time";

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
    <div className={`overflow-hidden rounded-xl border-[3px] border-yellow shadow-sm ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={zone ? `${city ?? ""} ${zone}` : city ?? ""}
        className="h-full w-full object-cover"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          el.parentElement?.classList.add("bg-[var(--accent-soft)]", "grid", "place-items-center");
        }}
      />
    </div>
  );
}
