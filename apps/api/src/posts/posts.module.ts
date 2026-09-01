import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LikesModule } from "../likes/likes.module";
import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  imports: [AuthModule, NotificationsModule, LikesModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
