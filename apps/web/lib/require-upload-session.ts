const SESSION_COOKIE = "tiptop_session";

export function uploadAuthFromRequest(request: Request): { authorization?: string; cookie?: string } {
  const authorization = request.headers.get("authorization") ?? undefined;
  const cookie = request.headers.get("cookie") ?? undefined;
  return { authorization, cookie };
}

export function hasUploadAuth(headers: { authorization?: string; cookie?: string }): boolean {
  if (headers.authorization?.startsWith("Bearer ") && headers.authorization.trim().length > 7) return true;
  if (headers.cookie && new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=`).test(headers.cookie)) return true;
  return false;
}

export async function requireUploadSession(request: Request): Promise<boolean> {
  const headers = uploadAuthFromRequest(request);
  if (!hasUploadAuth(headers)) return false;
  const api =
    process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001";
  try {
    const res = await fetch(`${api.replace(/\/$/, "")}/api/auth/me`, {
      headers: {
        ...(headers.authorization ? { authorization: headers.authorization } : {}),
        ...(headers.cookie ? { cookie: headers.cookie } : {}),
      },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
