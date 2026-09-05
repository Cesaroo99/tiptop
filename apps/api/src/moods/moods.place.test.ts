import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { moodHasPlace, moodPlaceLabel, validateMoodCoords } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("lieu optionnel d’un Mood (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("un mood peut exister sans aucune adresse", async () => {
    const amina = await prisma.user.findUnique({ where: { username: "amina.ngo" } });
    expect(amina).toBeTruthy();
    if (!amina) return;
    const mood = await prisma.mood.create({
      data: {
        authorId: amina.id,
        body: "Sans lieu, volontairement",
        visibility: "ZONE",
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    expect(moodHasPlace(mood)).toBe(false);
    expect(mood.placeName).toBeNull();
    expect(mood.address).toBeNull();
    expect(mood.latitude).toBeNull();
    await prisma.mood.delete({ where: { id: mood.id } });
  });

  it("un mood avec adresse et coordonnées reste retracable jusqu’à la carte", async () => {
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    if (!erica) return;
    const coords = validateMoodCoords(3.89, 11.512);
    const mood = await prisma.mood.create({
      data: {
        authorId: erica.id,
        body: "Rooftop ce soir",
        placeName: "Rooftop Bastos",
        address: "Rue 1.770, Bastos, Yaoundé",
        city: "Yaoundé",
        zone: "Bastos",
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        visibility: "ZONE",
        expiresAt: new Date(Date.now() + 3600_000),
      },
    });
    expect(moodHasPlace(mood)).toBe(true);
    expect(moodPlaceLabel(mood)).toBe("Rooftop Bastos");
    expect(mood.latitude).toBeCloseTo(3.89);
    expect(mood.longitude).toBeCloseTo(11.512);
    await prisma.mood.delete({ where: { id: mood.id } });
  });
});
