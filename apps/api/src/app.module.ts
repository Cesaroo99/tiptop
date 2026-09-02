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
import { EventsModule } from "./events/events.module";
import { DiscoveryModule } from "./discovery/discovery.module";
import { MoodsModule } from "./moods/moods.module";
import { InvitationsModule } from "./invitations/invitations.module";
import { ContactsModule } from "./contacts/contacts.module";
import { BookingModule } from "./booking/booking.module";
import { ChatModule } from "./chat/chat.module";
import { AdminModule } from "./admin/admin.module";
import { WishesModule } from "./wishes/wishes.module";

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
    EventsModule,
    DiscoveryModule,
    MoodsModule,
    InvitationsModule,
    ContactsModule,
    BookingModule,
    ChatModule,
    AdminModule,
    WishesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
