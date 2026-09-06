import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import { canAccessAdmin } from "@tiptop/domain";
import type { PublicUser } from "./auth.service";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { user?: PublicUser }>();
    if (!req.user || !canAccessAdmin(req.user.role)) {
      throw new ForbiddenException({ code: "ADMIN_ONLY" });
    }
    return true;
  }
}
