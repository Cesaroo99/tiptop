import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { MoodsController } from "./moods.controller";
import { MoodsService } from "./moods.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [MoodsController],
  providers: [MoodsService],
  exports: [MoodsService],
})
export class MoodsModule {}
