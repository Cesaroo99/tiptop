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
  bio?: string | null;
  website?: string | null;
  avatarUrl: string | null;
  coverUrl?: string | null;
  birthDate?: string | null;
  city: string | null;
  zone: string | null;
  availability: string;
  availabilityUntil: string | null;
  locationPrecision: string;
  latitude: number | null;
  longitude: number | null;
  currency?: string;
  country?: string | null;
  interests?: string[];
};

export type EventCard = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  city: string;
  zone: string | null;
  venue: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  startsAt: string;
  endsAt: string | null;
  priceXaf: number;
  currency: string;
  capacity: number | null;
  taken: number;
  remaining?: number | null;
  minAge: number | null;
  requiresReservation: boolean;
  paymentRule?: "HOLD" | "PAY_FIRST" | "PAY_REQUIRED";
  status: string;
  wanted?: boolean;
  allowGroups?: boolean;
  recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY" | string;
  seriesId?: string | null;
  occurrences?: Array<{ id: string; startsAt: string }>;
  phase?: "upcoming" | "startingSoon" | "ongoing" | "ended" | "cancelled";
  hearts: number;
  viewerHearted: boolean;
  viewerInterested: boolean;
  viewerStatus: string | null;
  isHost: boolean;
  canBook?: boolean;
  viewerReserved?: boolean;
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
  friendsGoing?: number;
  networkGoing?: number;
  reservedCount?: number;
  commentsCount?: number;
  postId?: string | null;
  viewerShowOnProfile?: boolean | null;
  createdAt?: string;
  people?: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    avatarUrl: string | null;
    status: string;
    profession?: string | null;
    available?: boolean;
  }>;
};

export type LikeTimeSnap = {
  totalSeconds: number;
  activeCount: number;
  likedByMe: boolean;
  label: string;
  hourSeconds?: number;
  daySeconds?: number;
  monthSeconds?: number;
  hourLabel?: string;
  dayLabel?: string;
  monthLabel?: string;
};

export type LikePlacement = {
  targetType: "user" | "post" | "comment" | "mood" | "wish";
  targetId: string;
  label: string;
  href: string;
  startedAt: string;
  seconds: number;
};

export type LikesMe = {
  available: number;
  total: number;
  placement: LikePlacement | null;
};

export type MoodItem = {
  id: string;
  body: string;
  imageUrl: string | null;
  videoUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  kind?: "MOOD" | "STATUS";
  interest?: string | null;
  commentsCount: number;
  likedAuthor: boolean;
  following?: boolean;
  soundKey?: string | null;
  soundLabel?: string | null;
  likedByMe?: boolean;
  authorActiveLikes: number;
  likeTime?: LikeTimeSnap;
  activity: string | null;
  city: string | null;
  zone: string | null;
  placeName?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeLabel?: string | null;
  event: { id: string; title: string } | null;
  companion: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    avatarUrl: string | null;
  } | null;
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

export type OfferItem = {
  id: string;
  kind: "PRODUCT" | "SERVICE";
  sellerKind: "PERSON" | "SHOP" | "BUSINESS";
  title: string;
  description: string;
  shopName: string | null;
  priceXaf: number;
  currency: string;
  city: string;
  zone: string | null;
  placeName: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  placeLabel: string | null;
  directionsUrl: string | null;
  imageUrl: string | null;
  status: string;
  isMine: boolean;
  distanceKm: number | null;
  distanceLabel: string | null;
  seller: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    avatarUrl: string | null;
    profession: string | null;
  };
};

export type SearchPerson = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profession: string | null;
  city: string | null;
  avatarUrl: string | null;
  available: boolean;
};

export type SearchPost = {
  id: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
  author: {
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
};

export type SearchEvent = {
  id: string;
  title: string;
  imageUrl: string | null;
  startsAt: string;
  city: string;
  zone: string | null;
  priceXaf: number;
  currency?: string;
  taken: number;
  viewerHearted: boolean;
  interestedCount?: number;
  viewerInterested?: boolean;
  viewerReserved?: boolean;
  recurrence?: string | null;
  host: {
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
};

export type SearchWish = {
  id: string;
  title: string;
  category: string;
  owner: { username: string; firstName: string; lastName: string };
};

export type SearchMood = {
  id: string;
  body: string;
  activity: string | null;
  city: string | null;
  author: { username: string; firstName: string; lastName: string };
};

export type SearchOffer = {
  id: string;
  title: string;
  priceXaf: number;
  currency?: string;
  city: string;
  shopName: string | null;
  seller: { username: string; firstName: string; lastName: string };
};

export type SearchResult = {
  suggested: boolean;
  people: SearchPerson[];
  posts: SearchPost[];
  events: SearchEvent[];
  wishes: SearchWish[];
  moods: SearchMood[];
  offers: SearchOffer[];
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
  city?: string | null;
  zone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm: number | null;
  distanceLabel?: string | null;
  available?: boolean;
  availability?: string;
  presence?: "AVAILABLE" | "UNSURE" | "UNAVAILABLE";
  circle?: "FRIEND" | "NEARBY" | "LATER";
  addedAsFriend?: boolean;
  likedByMe?: boolean;
  likeTime?: { totalSeconds: number; label: string };
  wishes?: Array<{ id: string; title: string; category: string }>;
  activeMood?: { id: string; activity: string | null; body: string; expiresAt: string } | null;
  why?: Array<{ key: string; count?: number }>;
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
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    imageUrl: string | null;
    hostId: string;
  };
};

export type EventManagePerson = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  avatarUrl: string | null;
  profession: string | null;
  available: boolean;
  status: string;
  ticketId: string | null;
  ticketStatus: string | null;
  paid: boolean;
  consumedAt: string | null;
};

export type EventManage = {
  eventId: string;
  counts: {
    all: number;
    interested: number;
    reserved: number;
    validated: number;
    confirmed: number;
    present: number;
  };
  tickets: Array<{
    id: string;
    status: string;
    consumedAt: string | null;
    paid: boolean;
    holder: { id: string; firstName: string; lastName: string; username: string; certified: boolean };
  }>;
  people: EventManagePerson[];
};

export type ReservationItem = {
  id: string;
  eventId: string;
  status: string;
  seats: number;
  amountXaf: number;
  currency?: string;
  needsPayment: boolean;
  tickets: Array<{ id: string; holderId: string; status: string }>;
  event?: { title: string; startsAt: string; city: string };
  invitations?: Array<{ id: string; status: string }>;
  intent?: string;
};

export type InvitationItem = {
  id: string;
  payer: string;
  payAfterAccept?: boolean;
  status: string;
  awaitingHostPay?: boolean;
  expiresAt: string;
  event: {
    id: string;
    title: string;
    startsAt: string;
    city: string;
    zone: string | null;
    priceXaf: number;
    currency?: string;
    paymentRule?: "HOLD" | "PAY_FIRST" | "PAY_REQUIRED";
    imageUrl?: string | null;
  };
  inviter: { id: string; username: string; firstName: string; lastName: string };
  invitee: { id: string; username: string; firstName: string; lastName: string };
  needsPayment?: boolean;
  reservation?: Pick<ReservationItem, "id" | "status" | "needsPayment" | "amountXaf"> & { currency?: string };
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
  likedByMe?: boolean;
  viewerFollows: boolean;
  authorActiveLikes: number;
  likeTime?: LikeTimeSnap;
  hint?: "followed" | "local" | "alive" | null;
  sharesCount?: number;
  author: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    avatarUrl: string | null;
    available?: boolean;
  };
  event?: {
    id: string;
    title: string;
    startsAt: string;
    minAge: number | null;
    city?: string | null;
    zone?: string | null;
    venue?: string | null;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    interestedCount: number;
    reservedCount: number;
    capacity?: number | null;
    remaining?: number | null;
    viewerInterested?: boolean;
    canBook?: boolean;
    viewerReserved?: boolean;
    recurrence?: string;
    seriesId?: string | null;
    priceXaf?: number;
  } | null;
};

export type CommentItem = {
  id: string;
  body: string;
  parentId?: string | null;
  createdAt: string;
  likedByMe?: boolean;
  likeTime?: LikeTimeSnap;
  author: { id: string; firstName: string; lastName: string; username: string; certified: boolean; avatarUrl?: string | null };
};

export type NotifItem = {
  id: string;
  type:
    | "LIKE"
    | "COMMENT"
    | "FOLLOW"
    | "INVITE"
    | "TICKET"
    | "PAYMENT"
    | "MESSAGE"
    | "REVIEW"
    | "WISH_OFFER"
    | "LIKE_MILESTONE"
    | "SOCIAL_INVITE"
    | "EVENT_UPDATE";
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  count?: number;
  createdAt: string;
  actor: { id: string; firstName: string; lastName: string; username: string; certified: boolean; avatarUrl?: string | null } | null;
};

export type SocialInviteContext = "RESTAURANT" | "CAFE" | "ACTIVITY" | "MEETUP" | "WISH";

export type SocialInvitePerson = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  certified: boolean;
  avatarUrl: string | null;
};

export type SocialInviteItem = {
  id: string;
  context: SocialInviteContext;
  label: string;
  message: string;
  status: "SENT" | "ACCEPTED" | "REFUSED" | "EXPIRED" | "CANCELLED";
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string;
  inviter: SocialInvitePerson;
  invitee: SocialInvitePerson;
  wish: { id: string; title: string; category: string } | null;
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
  likeTime?: {
    totalSeconds: number;
    historicalSeconds: number;
    activeSeconds: number;
    weekSeconds: number;
    label: string;
    weekLabel: string;
    lastMilestone: { id: string; label: string; achievedAt: string | null } | null;
  };
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

export type ConversationMember = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  avatarUrl?: string | null;
  host?: boolean;
  online?: boolean;
  lastSeenAt?: string | null;
};

export type ConversationItem = {
  id: string;
  kind: "DIRECT" | "GROUP" | "EVENT";
  title: string;
  channel: string | null;
  eventId: string | null;
  imageUrl: string | null;
  unreadCount: number;
  online: boolean;
  onlineCount: number;
  lastMessageSeen: boolean;
  peer: ConversationMember | null;
  members: ConversationMember[];
  lastMessage: { body: string; kind: string; createdAt: string; senderId: string } | null;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  kind: string;
  body: string;
  imageUrl: string | null;
  audioUrl?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  durationMs?: number | null;
  inviteType?: "EVENT" | "SOCIAL" | string | null;
  inviteId?: string | null;
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

function apiUrl(path: string) {
  const rel = path.startsWith("/api") ? path : `/api${path}`;
  if (typeof window === "undefined") return rel;
  return new URL(rel, window.location.origin).toString();
}

async function apiOnce<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "same-origin",
  });
  const text = await res.text();
  let data: Record<string, unknown> | null = null;
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    throw new ApiError(res.status || 502, "BAD_RESPONSE", text.slice(0, 120) || res.statusText);
  }
  if (!res.ok) {
    const nested =
      data && typeof data.message === "object" && data.message ? (data.message as Record<string, unknown>) : data;
    const code = nested?.code || data?.error || data?.message || "ERROR";
    const msg = nested?.message || (typeof data?.message === "string" ? data.message : res.statusText);
    throw new ApiError(res.status, String(code), String(msg));
  }
  return data as T;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await apiOnce<T>(path, init);
    } catch (err) {
      last = err;
      const retry = !(err instanceof ApiError) || err.status >= 502 || err.status === 503;
      if (!retry || attempt === 2) throw err;
      await new Promise((r) => setTimeout(r, 450 * (attempt + 1)));
    }
  }
  throw last;
}
