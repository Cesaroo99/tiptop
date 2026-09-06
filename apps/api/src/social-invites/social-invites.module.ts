import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ChatModule } from "../chat/chat.module";
import { SocialInvitesController } from "./social-invites.controller";
import { SocialInvitesService } from "./social-invites.service";

@Module({
  imports: [AuthModule, NotificationsModule, ChatModule],
  controllers: [SocialInvitesController],
  providers: [SocialInvitesService],
  exports: [SocialInvitesService],
})
export class SocialInvitesModule {}
