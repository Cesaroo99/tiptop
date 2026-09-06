import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ChatController } from "./chat.controller";
import { ChatGateway } from "./chat.gateway";
import { ChatRealtime } from "./chat.realtime";
import { ChatService } from "./chat.service";
import { PushService } from "./push.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRealtime, ChatGateway, PushService],
  exports: [ChatService, PushService],
})
export class ChatModule {}
