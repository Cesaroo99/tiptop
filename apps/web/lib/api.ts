export type PublicUser = {
  id: string;
  phoneE164: string;
  phoneMasked: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profileCompleted: boolean;
  locale: string;
  theme: string;
  profession: string | null;
  avatarUrl: string | null;
  city: string | null;
  zone: string | null;
  availability: string;
};

export type FeedItem = {
  id: string;
  body: string;
  imageUrl: string | null;
  city: string | null;
  zone: string | null;
  createdAt: string;
  commentsCount: number;
  likedAuthor: boolean;
  viewerFollows: boolean;
  authorActiveLikes: number;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    avatarUrl: string | null;
  };
};

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; username: string; certified: boolean };
};

export type NotifItem = {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW";
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; username: string; certified: boolean } | null;
};

const TOKEN_KEY = "tiptop_token";
const REMEMBER_KEY = "tiptop_remember";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string, remember: boolean) {
  sessionStorage.setItem(TOKEN_KEY, token);
  if (remember) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(path.startsWith("/api") ? path : `/api${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const nested = typeof data?.message === "object" && data.message ? data.message : data;
    const code = nested?.code || data?.error || data?.message || "ERROR";
    const msg = nested?.message || (typeof data?.message === "string" ? data.message : res.statusText);
    throw new ApiError(res.status, String(code), String(msg));
  }
  return data as T;
}
