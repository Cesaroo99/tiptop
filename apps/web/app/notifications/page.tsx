"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import {
  BellIcon,
  CalendarIcon,
  CheckIcon,
  CommentIcon,
  HeartIcon,
  MessageIcon,
  SparklesIcon,
  UsersIcon,
} from "@/components/Icons";
import { CardSkeleton, EmptyState, ScreenHeader } from "@/components/ui";
import { api, type NotifItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/time";

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
};

export default function NotificationsPage() {
  const { messages } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<NotifItem[] | null>(null);

  async function load() {
    const data = await api<{ items: NotifItem[] }>("/notifications");
    setItems(data.items);
  }

  useEffect(() => {
    void load();
  }, []);

  function label(n: NotifItem) {
    const name = n.actor ? `${n.actor.firstName} ${n.actor.lastName}` : messages.brand.name;
    if (n.type === "LIKE") return `${name} ${messages.social.notifLike}`;
    if (n.type === "WISH_OFFER") return `${name} ${messages.social.notifWish}`;
    if (n.type === "LIKE_MILESTONE") return messages.social.notifMilestone;
    if (n.type === "COMMENT") return `${name} ${messages.social.notifComment}`;
    if (n.type === "SOCIAL_INVITE") {
      return `${name} ${n.entityType === "social_invite_accepted" ? messages.social.notifSocialInviteAccepted : messages.social.notifSocialInvite}`;
    }
    if (n.type === "INVITE") return `${name} ${messages.social.notifInvite}`;
    if (n.type === "TICKET") return `${name} ${messages.social.notifTicket}`;
    if (n.type === "PAYMENT") return `${name} ${messages.social.notifPayment}`;
    if (n.type === "MESSAGE") return `${name} ${messages.social.notifMessage}`;
    if (n.type === "REVIEW") return `${name} ${messages.social.notifReview}`;
    return `${name} ${messages.social.notifFollow}`;
  }

  function href(n: NotifItem) {
    if (n.type === "WISH_OFFER") return "/wishes";
    if (n.type === "LIKE_MILESTONE") return "/likes";
    if (n.type === "SOCIAL_INVITE") return "/invitations";
    if (n.type === "MESSAGE" && n.entityId) return `/messages/${n.entityId}`;
    if (n.type === "REVIEW" && n.entityId) return `/events/${n.entityId}`;
    if (n.type === "TICKET" && n.entityId) return `/tickets/${n.entityId}`;
    if (n.type === "PAYMENT" && n.entityType === "like_purchase") return "/likes";
    if (n.type === "TICKET" || n.type === "PAYMENT") return "/tickets";
    if (n.type === "COMMENT" && n.entityType === "mood" && n.entityId) return `/mood/${n.entityId}`;
    if (n.type === "COMMENT" && n.entityId) return `/posts/${n.entityId}`;
    if (n.actor) return `/u/${n.actor.username}`;
    return "/";
  }

  const unread = items?.filter((n) => !n.read) ?? [];
  const read = items?.filter((n) => n.read) ?? [];

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader
        title={messages.common.notifications}
        onBack={() => router.back()}
        right={
          <button
            type="button"
            className="text-xs font-semibold text-accent"
            onClick={async () => {
              await api("/notifications/read-all", { method: "POST" });
              void load();
            }}
          >
            {messages.social.markAllRead}
          </button>
        }
      />
      {items === null ? (
        <div className="mt-2 space-y-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState title={messages.common.notifications} body={messages.social.emptyNotifs} icon={<BellIcon size={22} />} />
      ) : null}
      {unread.length ? <p className="type-label mb-2 mt-4 text-subtle">{messages.social.notifNew}</p> : null}
      {unread.map((n) => (
        <NotifCard key={n.id} n={n} label={label(n)} href={href(n)} unread />
      ))}
      {read.length ? <p className="type-label mb-2 mt-6 text-subtle">{messages.social.notifEarlier}</p> : null}
      {read.map((n) => (
        <NotifCard key={n.id} n={n} label={label(n)} href={href(n)} />
      ))}
    </main>
  );
}

function NotifCard({
  n,
  label,
  href,
  unread,
}: {
  n: NotifItem;
  label: string;
  href: string;
  unread?: boolean;
}) {
  const { locale } = useI18n();
  const TypeIcon = TYPE_ICON[n.type] ?? BellIcon;
  return (
    <Link
      href={href}
      onClick={() => {
        if (unread) void api(`/notifications/${n.id}/read`, { method: "POST" });
      }}
      className={`tap-scale mb-2 flex items-start gap-3 rounded-card p-4 shadow-xs transition hover:shadow-sm ${unread ? "bg-accent-soft" : "bg-surface"}`}
    >
      <div className="relative shrink-0">
        <Avatar src={n.actor?.avatarUrl} firstName={n.actor?.firstName} lastName={n.actor?.lastName} size="md" />
        <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-surface text-accent shadow-xs ring-2 ring-[var(--bg)]">
          <TypeIcon size={11} />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="type-body-sm text-ink">{label}</p>
        <p className="type-caption mt-0.5 text-muted">{formatDateTime(n.createdAt, locale)}</p>
      </div>
      {unread ? <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" /> : null}
    </Link>
  );
}
