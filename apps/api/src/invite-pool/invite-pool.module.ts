import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { InvitePoolController } from "./invite-pool.controller";
import { InvitePoolService } from "./invite-pool.service";

@Module({
  imports: [AuthModule],
  controllers: [InvitePoolController],
  providers: [InvitePoolService],
  exports: [InvitePoolService],
})
export class InvitePoolModule {}
