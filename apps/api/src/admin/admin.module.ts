import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AdminController, ReportsController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [AuthModule],
  controllers: [AdminController, ReportsController],
  providers: [AdminService],
})
export class AdminModule {}
