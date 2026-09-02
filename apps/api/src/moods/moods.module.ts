import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LikesModule } from "../likes/likes.module";
import { MoodsController } from "./moods.controller";
import { MoodsService } from "./moods.service";

@Module({
  imports: [AuthModule, NotificationsModule, LikesModule],
  controllers: [MoodsController],
  providers: [MoodsService],
  exports: [MoodsService],
})
export class MoodsModule {}
