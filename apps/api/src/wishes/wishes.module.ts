import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { WishesController } from "./wishes.controller";
import { WishesService } from "./wishes.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [WishesController],
  providers: [WishesService],
  exports: [WishesService],
})
export class WishesModule {}
