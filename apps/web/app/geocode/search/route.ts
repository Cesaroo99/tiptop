import { NextResponse } from "next/server";

export const runtime = "nodejs";

type NominatimHit = {
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

export type GeocodePlace = {
  placeName: string;
  address: string;
  city: string | null;
  zone: string | null;
  latitude: number;
  longitude: number;
};

function mapHit(hit: NominatimHit): GeocodePlace | null {
  const latitude = Number(hit.lat);
  const longitude = Number(hit.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  const addr = hit.address ?? {};
  const placeName =
    hit.name ||
    addr.amenity ||
    addr.tourism ||
    addr.shop ||
    addr.road ||
    hit.display_name?.split(",")[0] ||
    "Lieu";
  return {
    placeName: placeName.slice(0, 120),
    address: (hit.display_name || placeName).slice(0, 240),
    city: addr.city || addr.town || addr.village || null,
    zone: addr.suburb || addr.neighbourhood || addr.quarter || null,
    latitude,
    longitude,
  };
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [] });

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "5");
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "TipTop/1.0 (mood-place)" },
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ items: [] });
    const raw = (await res.json()) as NominatimHit[];
    const items = raw.map(mapHit).filter((p): p is GeocodePlace => Boolean(p));
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
