import { NextResponse } from "next/server";
import { nearestZone } from "@tiptop/domain";
import type { GeocodePlace } from "../search/route";

export const runtime = "nodejs";

type NominatimReverse = {
  display_name?: string;
  name?: string;
  lat?: string;
  lon?: string;
  address?: {
    amenity?: string;
    tourism?: string;
    shop?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
    city?: string;
    town?: string;
    village?: string;
  };
};

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("lat"));
  const longitude = Number(params.get("lng"));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ code: "COORDS_REQUIRED" }, { status: 400 });
  }

  const fallbackZone = nearestZone(latitude, longitude);
  const fallback: GeocodePlace = {
    placeName: fallbackZone?.zone ?? "Ma position",
    address: fallbackZone
      ? `${fallbackZone.zone}, ${fallbackZone.city}`
      : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    city: fallbackZone?.city ?? null,
    zone: fallbackZone?.zone ?? null,
    latitude,
    longitude,
  };

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "TipTop/1.0 (mood-place)" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ place: fallback });
    const hit = (await res.json()) as NominatimReverse;
    const addr = hit.address ?? {};
    const placeName =
      hit.name ||
      addr.amenity ||
      addr.tourism ||
      addr.road ||
      fallback.placeName;
    return NextResponse.json({
      place: {
        placeName: placeName.slice(0, 120),
        address: (hit.display_name || fallback.address).slice(0, 240),
        city: addr.city || addr.town || addr.village || fallback.city,
        zone: addr.suburb || addr.neighbourhood || addr.quarter || fallback.zone,
        latitude,
        longitude,
      } satisfies GeocodePlace,
    });
  } catch {
    return NextResponse.json({ place: fallback });
  }
}
