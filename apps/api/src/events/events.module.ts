import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { EventsController } from "./events.controller";
import { EventsService } from "./events.service";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [EventsController],
  providers: [EventsService, ReviewsService],
  exports: [EventsService, ReviewsService],
})
export class EventsModule {}
