import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LikesModule } from "../likes/likes.module";
import { BookingController, PaymentsWebhookController } from "./booking.controller";
import { BookingService } from "./booking.service";

@Module({
  imports: [AuthModule, NotificationsModule, LikesModule],
  controllers: [BookingController, PaymentsWebhookController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
