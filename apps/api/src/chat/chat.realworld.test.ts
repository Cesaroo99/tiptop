import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { directKey } from "@tiptop/domain";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("chat (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("n’autorise qu’un DM par paire", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const erica = await prisma.user.findUnique({ where: { username: "erica.sinclair" } });
    expect(cesar && erica).toBeTruthy();
    if (!cesar || !erica) return;
    const key = directKey(cesar.id, erica.id);
    const existing = await prisma.conversation.findUnique({ where: { directKey: key } });
    if (existing) {
      await expect(
        prisma.conversation.create({ data: { kind: "DIRECT", directKey: key } }),
      ).rejects.toMatchObject({ code: "P2002" });
      return;
    }
    const created = await prisma.conversation.create({
      data: {
        kind: "DIRECT",
        directKey: key,
        members: { create: [{ userId: cesar.id }, { userId: erica.id }] },
      },
    });
    try {
      await expect(
        prisma.conversation.create({ data: { kind: "DIRECT", directKey: key } }),
      ).rejects.toMatchObject({ code: "P2002" });
    } finally {
      await prisma.conversation.delete({ where: { id: created.id } });
    }
  });
});
