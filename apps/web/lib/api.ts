export type PublicUser = {
  id: string;
  phoneE164: string;
  phoneMasked: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  role: string;
  profileCompleted: boolean;
  locale: string;
  theme: string;
  profession: string | null;
  avatarUrl: string | null;
  city: string | null;
  zone: string | null;
  availability: string;
  availabilityUntil: string | null;
  locationPrecision: string;
  latitude: number | null;
  longitude: number | null;
};

export type EventCard = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  city: string;
  zone: string | null;
  venue: string | null;
  startsAt: string;
  endsAt: string | null;
  priceXaf: number;
  currency: string;
  capacity: number | null;
  taken: number;
  minAge: number | null;
  requiresReservation: boolean;
  status: string;
  hearts: number;
  viewerHearted: boolean;
  viewerInterested: boolean;
  viewerStatus: string | null;
  isHost: boolean;
  canBook?: boolean;
  viewerTicketId?: string | null;
  canChatGroup?: boolean;
  host: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    avatarUrl: string | null;
  };
  interestedCount?: number;
  reservedCount?: number;
  createdAt?: string;
  people?: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    avatarUrl: string | null;
    status: string;
  }>;
};

export type MoodItem = {
  id: string;
  body: string;
  imageUrl: string | null;
  expiresAt: string;
  createdAt: string;
  commentsCount: number;
  likedAuthor: boolean;
  authorActiveLikes: number;
  event: { id: string; title: string } | null;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    avatarUrl: string | null;
    city: string | null;
  };
};

export type PersonCard = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profession: string | null;
  age: number | null;
  avatarUrl: string | null;
  locationLabel: string | null;
  approximate: boolean;
  distanceKm: number | null;
};

export type TicketItem = {
  id: string;
  status: string;
  consumedAt: string | null;
  qr: string | null;
  qrActive: boolean;
  holder: { firstName: string; lastName: string; username: string };
  event: {
    id: string;
    title: string;
    startsAt: string;
    city: string;
    zone: string | null;
    venue: string | null;
    imageUrl: string | null;
    hostId: string;
  };
};

export type ReservationItem = {
  id: string;
  eventId: string;
  status: string;
  seats: number;
  amountXaf: number;
  needsPayment: boolean;
  tickets: Array<{ id: string; holderId: string; status: string }>;
  event?: { title: string; startsAt: string; city: string };
};

export type InvitationItem = {
  id: string;
  payer: string;
  status: string;
  expiresAt: string;
  event: { id: string; title: string; startsAt: string; city: string; zone: string | null; priceXaf: number };
  inviter: { id: string; username: string; firstName: string; lastName: string };
  invitee: { id: string; username: string; firstName: string; lastName: string };
  needsPayment?: boolean;
  reservation?: ReservationItem;
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
  event?: {
    id: string;
    title: string;
    startsAt: string;
    minAge: number | null;
    interestedCount: number;
    reservedCount: number;
  } | null;
};

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; firstName: string; lastName: string; username: string; certified: boolean; avatarUrl?: string | null };
};

export type NotifItem = {
  id: string;
  type: "LIKE" | "COMMENT" | "FOLLOW" | "INVITE" | "TICKET" | "PAYMENT" | "MESSAGE" | "REVIEW";
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; username: string; certified: boolean; avatarUrl?: string | null } | null;
};

export type LikePack = {
  code: string;
  units: number;
  amountXaf: number;
};

export type LikePerson = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatarUrl?: string | null;
};

export type LikeProduction = {
  active: number;
  perHour: number;
  perDay: number;
  perMonth: number;
  ratio?: { value: number; unit: "hour" | "second" };
  receivedFrom?: LikePerson[];
  placedOn?: LikePerson | null;
};

export type LikeWallet = {
  available: number;
  total: number;
  packs: LikePack[];
  placedOn?: LikePerson | null;
  receivedFrom?: LikePerson[];
  production?: LikeProduction;
  allocations: Array<{ unitId: string; source: string; toUser: LikePerson }>;
  history: Array<{
    id: string;
    kind: "PURCHASE" | "ALLOCATE" | "RELEASE";
    delta: number;
    createdAt: string;
    toUser: LikePerson | null;
    packCode: string | null;
    units: number;
  }>;
  purchases: Array<{
    id: string;
    packCode: string;
    units: number;
    amountXaf: number;
    createdAt: string;
    paymentStatus: string | null;
    provider: string | null;
  }>;
};

export type ConversationItem = {
  id: string;
  kind: "DIRECT" | "GROUP" | "EVENT";
  title: string;
  channel: string | null;
  eventId: string | null;
  unreadCount: number;
  online: boolean;
  peer: { id: string; username: string; firstName: string; lastName: string; certified: boolean; avatarUrl?: string | null } | null;
  members: Array<{ id: string; username: string; firstName: string; lastName: string; certified: boolean; avatarUrl?: string | null }>;
  lastMessage: { body: string; kind: string; createdAt: string; senderId: string } | null;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  kind: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  sender: { id: string; username: string; firstName: string; lastName: string; certified: boolean; avatarUrl?: string | null };
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
