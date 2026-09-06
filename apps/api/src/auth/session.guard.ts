import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

export const SESSION_COOKIE = "tiptop_session";

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    const token = bearer || req.cookies?.[SESSION_COOKIE];
    if (!token) throw new UnauthorizedException("UNAUTHENTICATED");
    const user = await this.auth.resolveSession(token);
    if (!user) throw new UnauthorizedException("UNAUTHENTICATED");
    req.user = user;
    return true;
  }
}
