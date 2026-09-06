import { config } from "dotenv";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AuthService } from "../auth/auth.service";
import { PrismaService } from "../prisma.service";
import { UsersService } from "./users.service";
import { ChatService } from "../chat/chat.service";

config({ path: resolve(__dirname, "../../.env") });
const prisma = new PrismaClient();

describe("compte self-service (DB)", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  it("met à jour bio, site, avatar et date de naissance", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" }, include: { profile: true } });
    expect(cesar).toBeTruthy();
    if (!cesar) return;

    const previous = {
      bio: cesar.profile?.bio ?? null,
      website: cesar.profile?.website ?? null,
      avatarUrl: cesar.profile?.avatarUrl ?? null,
      birthDate: cesar.profile?.birthDate ?? null,
    };

    const users = new UsersService(prisma as unknown as PrismaService, new AuthService(prisma as unknown as PrismaService));
    const updated = await users.updateMe(cesar.id, {
      bio: "On sort vraiment — test compte.",
      website: "https://tiptop.cm/",
      avatarUrl: "/seed/avatars/cesar.jpg",
      birthDate: "1994-05-12",
    });

    expect(updated.bio).toBe("On sort vraiment — test compte.");
    expect(updated.website).toBe("tiptop.cm");
    expect(updated.avatarUrl).toBe("/seed/avatars/cesar.jpg");
    expect(updated.birthDate).toBe("1994-05-12");

    await prisma.profile.update({
      where: { userId: cesar.id },
      data: {
        bio: previous.bio,
        website: previous.website,
        avatarUrl: previous.avatarUrl,
        birthDate: previous.birthDate,
      },
    });
  });

  it("liste et débloque une personne", async () => {
    const cesar = await prisma.user.findUnique({ where: { username: "cesar_memoli" } });
    const william = await prisma.user.findUnique({ where: { username: "william.ekani" } });
    expect(cesar && william).toBeTruthy();
    if (!cesar || !william) return;

    await prisma.userBlock.deleteMany({ where: { blockerId: cesar.id, blockedId: william.id } });
    const chat = new ChatService(
      prisma as unknown as PrismaService,
      {} as never,
      {} as never,
      {} as never,
    );
    await chat.block(cesar.id, william.id);
    const listed = await chat.listBlocks(cesar.id);
    expect(listed.items.some((p) => p.id === william.id)).toBe(true);
    await chat.unblock(cesar.id, william.id);
    const after = await chat.listBlocks(cesar.id);
    expect(after.items.some((p) => p.id === william.id)).toBe(false);
  });
});
