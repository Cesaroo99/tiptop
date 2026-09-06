import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { EventsController } from "./events.controller";
import { EventGroupsController } from "./groups.controller";
import { EventsService } from "./events.service";
import { EventGroupsService } from "./groups.service";
import { ReviewsService } from "./reviews.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [EventsController, EventGroupsController],
  providers: [EventsService, EventGroupsService, ReviewsService],
  exports: [EventsService, EventGroupsService, ReviewsService],
})
export class EventsModule {}
