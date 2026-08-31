"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, ScreenHeader } from "@/components/ui";
import { api, type NotifItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

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
    if (n.type === "COMMENT") return `${name} ${messages.social.notifComment}`;
    if (n.type === "INVITE") return `${name} ${messages.social.notifInvite}`;
    if (n.type === "TICKET") return `${name} ${messages.social.notifTicket}`;
    if (n.type === "PAYMENT") return `${name} ${messages.social.notifPayment}`;
    if (n.type === "MESSAGE") return `${name} ${messages.social.notifMessage}`;
    return `${name} ${messages.social.notifFollow}`;
  }

  function href(n: NotifItem) {
    if (n.type === "INVITE") return "/tickets";
    if (n.type === "MESSAGE" && n.entityId) return `/messages/${n.entityId}`;
    if (n.type === "TICKET" && n.entityId) return `/tickets/${n.entityId}`;
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
      {items && items.length === 0 ? (
        <EmptyState title={messages.common.notifications} body={messages.social.emptyNotifs} />
      ) : null}
      {unread.length ? <p className="mb-2 mt-4 text-sm text-muted">{messages.social.notifNew}</p> : null}
      {unread.map((n) => (
        <NotifCard key={n.id} n={n} label={label(n)} href={href(n)} unread />
      ))}
      {read.length ? <p className="mb-2 mt-6 text-sm text-muted">{messages.social.notifEarlier}</p> : null}
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
  return (
    <Link
      href={href}
      onClick={() => {
        if (unread) void api(`/notifications/${n.id}/read`, { method: "POST" });
      }}
      className="mb-2 flex items-start gap-3 rounded-card bg-surface p-4 shadow-card"
    >
      <div className="h-10 w-10 rounded-full bg-accent/20" />
      <div className="flex-1">
        <p className="text-sm text-ink">{label}</p>
        <p className="text-xs text-muted">{new Date(n.createdAt).toLocaleString()}</p>
      </div>
      {unread ? <span className="mt-1 h-2 w-2 rounded-full bg-yellow" /> : null}
    </Link>
  );
}
