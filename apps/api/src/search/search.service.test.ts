import { config } from "dotenv";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaService } from "../prisma.service";
import { SearchService } from "./search.service";

config({ path: resolve(__dirname, "../../.env") });

describe("recherche globale", () => {
  const prisma = new PrismaService();
  const search = new SearchService(prisma);
  let cesarId = "";

  beforeAll(async () => {
    await prisma.$connect();
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    expect(cesar).toBeTruthy();
    cesarId = cesar?.id ?? "";
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("sans mot : suggestions de la ville (personnes + sorties), pas le viewer", async () => {
    if (!cesarId) return;
    const result = await search.search({ q: "", type: "all", viewerId: cesarId, city: "Yaoundé", zone: "Carrefour Damas" });
    expect(result.suggested).toBe(true);
    expect(result.posts).toEqual([]);
    expect(result.people.some((p) => p.id === cesarId)).toBe(false);
    expect(result.people.some((p) => p.username === "erica.sinclair")).toBe(true);
    const erica = result.people.find((p) => p.username === "erica.sinclair");
    expect(erica?.avatarUrl || erica?.profession).toBeTruthy();
    expect(result.events.some((e) => e.title.includes("Piscine"))).toBe(true);
    const piscine = result.events.find((e) => e.title.includes("Piscine"));
    expect(piscine?.imageUrl).toBeTruthy();
    expect(piscine?.host.firstName).toBeTruthy();
    expect(typeof piscine?.taken).toBe("number");
    expect(piscine?.capacity == null || typeof piscine.capacity === "number").toBe(true);
    expect(piscine?.remaining == null || typeof piscine.remaining === "number").toBe(true);
    expect(typeof piscine?.viewerHearted).toBe("boolean");
    expect(piscine?.city.toLowerCase()).toBe("yaoundé");
  });

  it("texte « Piscine » trouve la sortie réelle", async () => {
    if (!cesarId) return;
    const result = await search.search({ q: "Piscine", type: "events", viewerId: cesarId, city: "Yaoundé" });
    expect(result.suggested).toBe(false);
    expect(result.events.some((e) => e.title.includes("Piscine party"))).toBe(true);
    expect(result.people).toEqual([]);
  });

  it("texte « Erica » trouve la personne, même hors filtre de zone", async () => {
    if (!cesarId) return;
    const result = await search.search({ q: "Erica", type: "people", viewerId: cesarId, city: "Douala", zone: "Akwa" });
    expect(result.suggested).toBe(false);
    expect(result.people.some((p) => p.username === "erica.sinclair")).toBe(true);
  });
});
