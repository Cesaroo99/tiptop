import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DiscoveryModule } from "../discovery/discovery.module";
import { EventsModule } from "../events/events.module";
import { SocialInvitesModule } from "../social-invites/social-invites.module";
import { IntelligenceController } from "./intelligence.controller";
import { IntelligenceService } from "./intelligence.service";

@Module({
  imports: [AuthModule, DiscoveryModule, EventsModule, SocialInvitesModule],
  controllers: [IntelligenceController],
  providers: [IntelligenceService],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
