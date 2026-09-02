import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("mood actif visible dans la découverte (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("un mood expiré n’apparaît plus comme actif", async () => {
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    expect(erica).toBeTruthy();
    if (!erica) return;
    const mood = await prisma.mood.create({
      data: {
        authorId: erica.id,
        body: "E2E mood expiré",
        activity: "🍣 Restaurant japonais",
        city: "Yaoundé",
        zone: "Bastos",
        visibility: "ZONE",
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    const active = await prisma.mood.findMany({
      where: { authorId: erica.id, expiresAt: { gt: new Date() } },
    });
    expect(active.some((m) => m.id === mood.id)).toBe(false);
    await prisma.mood.delete({ where: { id: mood.id } });
  });

  it("un mood actif porte bien une activité et une zone", async () => {
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    if (!erica) return;
    const mood = await prisma.mood.create({
      data: {
        authorId: erica.id,
        body: "E2E mood actif",
        activity: "🍣 Restaurant japonais",
        city: "Yaoundé",
        zone: "Bastos",
        visibility: "ZONE",
        expiresAt: new Date(Date.now() + 2 * 3600_000),
      },
    });
    expect(mood.activity).toBe("🍣 Restaurant japonais");
    expect(mood.zone).toBe("Bastos");
    await prisma.mood.delete({ where: { id: mood.id } });
  });
});
