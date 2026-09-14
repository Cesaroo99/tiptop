import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasPermission, type AdminPermission } from "@tiptop/domain";
import type { Request } from "express";
import type { PublicUser } from "./auth.service";

export const ADMIN_PERMISSION_KEY = "admin_permission";

export const RequirePermission = (permission: AdminPermission) =>
  SetMetadata(ADMIN_PERMISSION_KEY, permission);

@Injectable()
export class AdminPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<AdminPermission | undefined>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!permission) return true;
    const req = context.switchToHttp().getRequest<Request & { user?: PublicUser }>();
    if (!req.user || !hasPermission(req.user.role, permission)) {
      throw new ForbiddenException({ code: "ADMIN_FORBIDDEN", permission });
    }
    return true;
  }
}
