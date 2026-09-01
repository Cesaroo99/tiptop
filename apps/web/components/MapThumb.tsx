"use client";

import { ZONE_COORDS } from "@/lib/time";

export function MapThumb({
  city,
  zone,
  className = "",
}: {
  city?: string | null;
  zone?: string | null;
  className?: string;
}) {
  const point = (zone && ZONE_COORDS[zone]) || ZONE_COORDS["Carrefour Damas"];
  const src = `https://staticmap.openstreetmap.de/staticmap.php?center=${point.lat},${point.lng}&zoom=14&size=240x180&maptype=mapnik`;
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
