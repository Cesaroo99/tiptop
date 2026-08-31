import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { FeedModule } from "./feed/feed.module";

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, FeedModule],
  controllers: [HealthController],
})
export class AppModule {}
