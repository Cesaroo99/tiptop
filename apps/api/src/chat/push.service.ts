import { Inject, Injectable } from "@nestjs/common";
import type { PushCategory } from "@tiptop/domain";
import { PrismaService } from "../prisma.service";

@Injectable()
export class PushService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async prefs(userId: string) {
    const row = await this.prisma.pushPreference.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });
    return { messages: row.messages, social: row.social, events: row.events };
  }

  async updatePrefs(userId: string, patch: { messages?: boolean; social?: boolean; events?: boolean }) {
    const row = await this.prisma.pushPreference.upsert({
      where: { userId },
      update: patch,
      create: {
        userId,
        messages: patch.messages ?? true,
        social: patch.social ?? true,
        events: patch.events ?? true,
      },
    });
    return { messages: row.messages, social: row.social, events: row.events };
  }

  async registerDevice(userId: string, platform: string, pushToken?: string | null) {
    const p = platform.trim().slice(0, 32) || "web";
    const row = await this.prisma.device.upsert({
      where: { userId_platform: { userId, platform: p } },
      update: { pushToken: pushToken ?? undefined, lastSeenAt: new Date() },
      create: { userId, platform: p, pushToken: pushToken ?? null },
    });
    return { id: row.id, platform: row.platform, hasToken: Boolean(row.pushToken) };
  }

  async touch(userId: string) {
    await this.prisma.device.updateMany({
      where: { userId, platform: "web" },
      data: { lastSeenAt: new Date() },
    });
  }

  lastSeen(userId: string) {
    return this.prisma.device.findFirst({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
      select: { lastSeenAt: true },
    });
  }

  async notify(input: {
    userId: string;
    category: PushCategory;
    title: string;
    body: string;
    deepLink: string;
  }): Promise<{ ok: true; provider: "noop" } | { ok: false; reason: string }> {
    const prefs = await this.prefs(input.userId);
    if (!prefs[input.category]) return { ok: false, reason: "PREF_OFF" };
    // Provider no-op : jeton éventuellement stocké, aucun envoi réel.
    // eslint-disable-next-line no-console
    console.log(`[push:noop] ${input.userId} ${input.category} ${input.deepLink} ${input.title}`);
    return { ok: true, provider: "noop" };
  }
}
