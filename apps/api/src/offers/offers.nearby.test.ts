import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { offerDistanceKm, rankOffers } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("offres locales (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("le seed place des produits et services à Yaoundé avec un prix et un lieu", async () => {
    const items = await prisma.offer.findMany({ where: { status: "ACTIVE", city: "Yaoundé" } });
    expect(items.length).toBeGreaterThanOrEqual(3);
    expect(items.some((o) => o.kind === "PRODUCT" && o.priceXaf > 0)).toBe(true);
    expect(items.some((o) => o.kind === "SERVICE" && o.latitude != null)).toBe(true);
    const origin = { latitude: 3.848, longitude: 11.5021 };
    const ranked = rankOffers(
      items.map((o) => ({
        id: o.id,
        priceXaf: o.priceXaf,
        distanceKm: offerDistanceKm(origin, o),
      })),
      "near",
    );
    expect(ranked[0]?.distanceKm ?? 99).toBeLessThanOrEqual(ranked[ranked.length - 1]?.distanceKm ?? 99);
  });
});
