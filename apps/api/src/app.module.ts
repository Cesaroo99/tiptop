import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma.module";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { FeedModule } from "./feed/feed.module";
import { PostsModule } from "./posts/posts.module";
import { FollowsModule } from "./follows/follows.module";
import { LikesModule } from "./likes/likes.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SearchModule } from "./search/search.module";
import { ProfilesModule } from "./profiles/profiles.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    FeedModule,
    FollowsModule,
    LikesModule,
    NotificationsModule,
    SearchModule,
    ProfilesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
