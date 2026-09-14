import { Global, Module } from "@nestjs/common";
import { FeatureFlagsService } from "./config/feature-flags.service";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService, FeatureFlagsService],
  exports: [PrismaService, FeatureFlagsService],
})
export class PrismaModule {}
