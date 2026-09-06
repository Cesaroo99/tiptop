"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { EventInvitationSheet } from "@/components/EventInvitationSheet";
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  CommentIcon,
  HeartIcon,
  MessageIcon,
  SearchIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/Icons";
import { SocialInviteSheet } from "@/components/SocialInviteSheet";
import { CardSkeleton, EmptyState, ScreenHeader } from "@/components/ui";
import { api, ApiError, type InvitationItem, type NotifItem, type SocialInviteItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { notifAction, notifLabel } from "@/lib/notif";
import { formatRelative } from "@/lib/time";

const TYPE_ICON: Record<NotifItem["type"], React.ComponentType<{ size?: number; className?: string }>> = {
  LIKE: HeartIcon,
  LIKE_MILESTONE: HeartIcon,
  COMMENT: CommentIcon,
  FOLLOW: UsersIcon,
  INVITE: CalendarIcon,
  SOCIAL_INVITE: SparklesIcon,
  WISH_OFFER: SparklesIcon,
  TICKET: CheckIcon,
  PAYMENT: CheckIcon,
  MESSAGE: MessageIcon,
  REVIEW: CommentIcon,
  EVENT_UPDATE: CalendarIcon,
};

export default function NotificationsPage() {
  const { messages } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[] | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [eventInvite, setEventInvite] = useState<InvitationItem | null>(null);
  const [socialInvite, setSocialInvite] = useState<SocialInviteItem | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<{ items: NotifItem[] }>("/notifications");
    setItems(data.items);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((n) => notifLabel(n, messages).toLowerCase().includes(q));
  }, [items, query, messages]);

  const unread = filtered?.filter((n) => !n.read) ?? [];
  const read = filtered?.filter((n) => n.read) ?? [];

  async function markRead(id: string) {
    await api(`/notifications/${id}/read`, { method: "POST" });
    setItems((cur) => cur?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? cur);
  }

  async function open(n: NotifItem) {
    if (!n.read) void markRead(n.id);
    const action = notifAction(n);
    if (action.kind === "href") {
      router.push(action.href);
      return;
    }
    if (action.kind === "event-invite") {
      const inv = await api<InvitationItem>(`/invitations/${action.id}`);
      setEventInvite(inv);
      return;
    }
    const inv = await api<SocialInviteItem>(`/social-invites/${action.id}`);
    setSocialInvite(inv);
  }

  async function acceptEvent() {
    if (!eventInvite) return;
    setBusy(true);
    try {
      const res = await api<
        InvitationItem & { reservation?: { id: string }; needsPayment?: boolean; awaitingHostPay?: boolean; conversationId?: string }
      >(`/invitations/${eventInvite.id}/accept`, { method: "POST" });
      setEventInvite(null);
      if (res.needsPayment && res.reservation) {
        router.push(`/events/${res.event.id}/pay?reservationId=${res.reservation.id}`);
        return;
      }
      if (res.conversationId) {
        router.replace(`/messages/${res.conversationId}`);
        return;
      }
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.code === "HOST_PAYMENT_PENDING") setEventInvite({ ...eventInvite, status: "PENDING" });
    } finally {
      setBusy(false);
    }
  }

  async function refuseEvent() {
    if (!eventInvite) return;
    setBusy(true);
    try {
      await api(`/invitations/${eventInvite.id}/refuse`, { method: "POST" });
      setEventInvite(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function acceptSocial() {
    if (!socialInvite) return;
    setBusy(true);
    try {
      const res = await api<SocialInviteItem & { conversationId?: string }>(`/social-invites/${socialInvite.id}/accept`, {
        method: "POST",
      });
      setSocialInvite(null);
      if (res.conversationId) router.push(`/messages/${res.conversationId}`);
      else await load();
    } finally {
      setBusy(false);
    }
  }

  async function refuseSocial() {
    if (!socialInvite) return;
    setBusy(true);
    try {
      await api(`/social-invites/${socialInvite.id}/refuse`, { method: "POST" });
      setSocialInvite(null);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-[var(--bg)] px-4 py-4">
      <ScreenHeader
        title={messages.common.notifications}
        onBack={() => router.back()}
        right={
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={messages.social.searchNotifs}
              onClick={() => setSearchOpen((v) => !v)}
              className="tap-scale grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent"
            >
              <SearchIcon size={16} />
            </button>
            <button
              type="button"
              className="type-caption font-semibold text-accent"
              onClick={async () => {
                await api("/notifications/read-all", { method: "POST" });
                void load();
              }}
            >
              {messages.social.markAllRead}
            </button>
          </div>
        }
      />
      {searchOpen ? (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={messages.social.searchNotifs}
          className="mb-3 h-11 w-full rounded-full bg-surface px-4 type-body-sm text-ink outline-none shadow-xs"
        />
      ) : null}
      {items === null ? (
        <div className="mt-2 space-y-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState title={messages.common.notifications} body={messages.social.emptyNotifs} icon={<BellIcon size={22} />} />
      ) : null}
      {unread.length ? <p className="type-label mb-2 mt-3 text-subtle">{messages.social.notifNew}</p> : null}
      {unread.map((n) => (
        <NotifCard key={n.id} n={n} label={notifLabel(n, messages)} unread onOpen={() => void open(n)} />
      ))}
      {read.length ? <p className="type-label mb-2 mt-6 text-subtle">{messages.social.notifEarlier}</p> : null}
      {read.map((n) => (
        <NotifCard key={n.id} n={n} label={notifLabel(n, messages)} onOpen={() => void open(n)} />
      ))}
      <EventInvitationSheet
        invitation={eventInvite}
        open={Boolean(eventInvite)}
        canRespond={eventInvite?.status === "PENDING"}
        busy={busy}
        onClose={() => setEventInvite(null)}
        onAccept={() => void acceptEvent()}
        onRefuse={() => void refuseEvent()}
      />
      <SocialInviteSheet
        invitation={socialInvite}
        open={Boolean(socialInvite)}
        canRespond={socialInvite?.status === "SENT"}
        busy={busy}
        onClose={() => setSocialInvite(null)}
        onAccept={() => void acceptSocial()}
        onRefuse={() => void refuseSocial()}
      />
    </main>
  );
}

function NotifCard({
  n,
  label,
  unread,
  onOpen,
}: {
  n: NotifItem;
  label: string;
  unread?: boolean;
  onOpen: () => void;
}) {
  const { messages } = useI18n();
  const TypeIcon = TYPE_ICON[n.type] ?? BellIcon;
  const invite = n.type === "INVITE" || (n.type === "SOCIAL_INVITE" && n.entityType !== "social_invite_accepted");
  return (
    <button
      type="button"
      onClick={onOpen}
      className="tap-scale mb-2 flex w-full items-start gap-3 rounded-[22px] bg-surface p-3.5 text-left shadow-xs"
    >
      <div className="relative shrink-0">
        <Avatar src={n.actor?.avatarUrl} firstName={n.actor?.firstName} lastName={n.actor?.lastName} size="md" />
        <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full bg-surface text-accent shadow-xs ring-2 ring-[var(--bg)]">
          <TypeIcon size={11} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="type-body-sm text-ink">{label}</p>
        <p className="type-caption mt-1 font-semibold text-accent">
          {formatRelative(n.createdAt, messages.social)}
        </p>
        {invite ? (
          <span className="type-caption mt-2 inline-block font-semibold text-ink">{messages.social.notifInviteConsult}</span>
        ) : null}
      </div>
      {unread ? <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-yellow" /> : null}
    </button>
  );
}
