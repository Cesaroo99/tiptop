import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { FollowsModule } from "../follows/follows.module";
import { LikesModule } from "../likes/likes.module";
import { PostsModule } from "../posts/posts.module";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";

@Module({
  imports: [AuthModule, FollowsModule, LikesModule, PostsModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
})
export class ProfilesModule {}
