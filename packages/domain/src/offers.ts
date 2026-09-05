import { formatApproxDistance, haversineKm } from "./location";

export type OfferKind = "PRODUCT" | "SERVICE";
export type OfferSellerKind = "PERSON" | "SHOP" | "BUSINESS";
export type OfferSort = "near" | "price";

export function parseOfferKind(value?: string | null): OfferKind | null {
  if (value === "PRODUCT" || value === "SERVICE") return value;
  return null;
}

export function parseOfferSellerKind(value?: string | null): OfferSellerKind {
  if (value === "SHOP" || value === "BUSINESS") return value;
  return "PERSON";
}

export function parseOfferSort(value?: string | null): OfferSort {
  return value === "price" ? "price" : "near";
}

export function offerDistanceKm(
  origin: { latitude: number; longitude: number } | null,
  point: { latitude: number | null; longitude: number | null },
): number | null {
  if (!origin || point.latitude == null || point.longitude == null) return null;
  return haversineKm(origin, { latitude: point.latitude, longitude: point.longitude });
}

export function rankOffers<T extends { priceXaf: number; distanceKm: number | null }>(
  items: T[],
  sort: OfferSort,
): T[] {
  return [...items].sort((a, b) => {
    if (sort === "price") {
      if (a.priceXaf !== b.priceXaf) return a.priceXaf - b.priceXaf;
      return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
    }
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
    if (da !== db) return da - db;
    return a.priceXaf - b.priceXaf;
  });
}

export function offerDistanceLabel(km: number | null): string | null {
  if (km == null) return null;
  return formatApproxDistance(km);
}
