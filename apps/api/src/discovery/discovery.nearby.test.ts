import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { displayLocation, isCurrentlyAvailable } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("personnes proches (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("ne révèle pas une localisation HIDDEN", async () => {
    const hidden = displayLocation({ precision: "HIDDEN", city: "Yaoundé", zone: "Bastos" });
    expect(hidden.label).toBeNull();
    expect(hidden.approximate).toBe(true);
  });

  it("respecte la disponibilité", async () => {
    const erica = await prisma.user.findUnique({
      where: { username: "erica.sinclair" },
      include: { profile: true },
    });
    expect(erica?.profile).toBeTruthy();
    if (!erica?.profile) return;
    expect(
      isCurrentlyAvailable({
        availability: erica.profile.availability,
        availabilityUntil: erica.profile.availabilityUntil,
      }),
    ).toBe(true);
  });

  it("filtre par ville sans exposer les profils masqués", async () => {
    const rows = await prisma.user.findMany({
      where: {
        status: "ACTIVE",
        profileCompleted: true,
        profile: { city: "Yaoundé", locationPrecision: { not: "HIDDEN" } },
      },
      include: { profile: true },
    });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((u) => u.profile?.locationPrecision !== "HIDDEN")).toBe(true);
  });
});
