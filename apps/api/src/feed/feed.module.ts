import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { PostsModule } from "../posts/posts.module";
import { EventsModule } from "../events/events.module";
import { MoodsModule } from "../moods/moods.module";
import { DiscoveryModule } from "../discovery/discovery.module";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";

@Module({
  imports: [AuthModule, PostsModule, EventsModule, MoodsModule, DiscoveryModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
