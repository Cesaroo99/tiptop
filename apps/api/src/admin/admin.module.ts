import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdminPermissionGuard } from "../auth/admin-permission.guard";
import { AdminController, ReportsController } from "./admin.controller";
import { AdminCommandController } from "./admin-command.controller";
import { AdminService } from "./admin.service";
import { AdminCommandService } from "./admin-command.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [AdminController, ReportsController, AdminCommandController],
  providers: [AdminService, AdminCommandService, AdminPermissionGuard],
})
export class AdminModule {}
