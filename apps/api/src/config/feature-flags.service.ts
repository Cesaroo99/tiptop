import { Inject, Injectable } from "@nestjs/common";
import {
  FEATURE_FLAGS_CONFIG_KEY,
  isFeatureEnabled,
  parseFeatureFlags,
  type FeatureFlagKey,
} from "@tiptop/domain";
import { PrismaService } from "../prisma.service";

@Injectable()
export class FeatureFlagsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async flags() {
    const row = await this.prisma.appConfig.findUnique({ where: { key: FEATURE_FLAGS_CONFIG_KEY } });
    return parseFeatureFlags(row?.value);
  }

  async enabled(key: FeatureFlagKey, ctx?: { country?: string | null; tester?: boolean; userId?: string }) {
    const flags = await this.flags();
    const bucket = ctx?.userId ? bucketFromId(ctx.userId) : 0;
    return isFeatureEnabled(flags, key, { country: ctx?.country, tester: ctx?.tester, bucket });
  }
}

function bucketFromId(id: string): number {
  let n = 0;
  for (let i = 0; i < id.length; i += 1) n = (n + id.charCodeAt(i) * (i + 1)) % 100;
  return n;
}
