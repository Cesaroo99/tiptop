"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { BellIcon, ChevronDownIcon, MessageIcon, PinIcon, SearchIcon } from "./Icons";
import { Logo } from "./Logo";

export function AppHeader({
  location,
}: {
  location?: string | null;
}) {
  const { messages } = useI18n();
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  useEffect(() => {
    api<{ unreadCount: number }>("/notifications")
      .then((d) => setUnread(d.unreadCount))
      .catch(() => setUnread(0));
    api<{ unreadTotal: number }>("/conversations")
      .then((d) => setChatUnread(d.unreadTotal ?? 0))
      .catch(() => setChatUnread(0));
  }, []);

  return (
    <header className="phone-safe-top space-y-3 px-4 pb-1">
      <div className="flex items-center justify-between">
        <Logo size={34} />
        <div className="flex items-center gap-1.5">
          <HeaderIcon href="/notifications" label="Notifications" badge={unread > 0 ? String(unread) : undefined}>
            <BellIcon size={18} />
          </HeaderIcon>
          <HeaderIcon href="/messages" label="Messages" badge={chatUnread > 0 ? String(chatUnread) : undefined}>
            <MessageIcon size={18} />
          </HeaderIcon>
          <HeaderIcon href="/menu" label="Menu">
            <Hamburger />
          </HeaderIcon>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/zone"
          className="tap-scale type-body-sm flex h-12 flex-1 items-center gap-2 rounded-full bg-surface-sunken px-4 text-left text-ink transition hover:brightness-95"
        >
          <PinIcon size={16} className="shrink-0 text-muted" />
          <span className="flex-1 truncate font-semibold">{location || messages.home.locationFallback}</span>
          <ChevronDownIcon size={14} className="shrink-0 text-muted" />
        </Link>
        <Link
          href="/search"
          aria-label="Recherche"
          className="tap-scale grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-sunken text-muted transition hover:brightness-95"
        >
          <SearchIcon size={18} />
        </Link>
      </div>
    </header>
  );
}

function HeaderIcon({
  href,
  label,
  badge,
  children,
}: {
  href: string;
  label: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="tap-scale relative grid h-10 w-10 place-items-center rounded-full bg-surface-sunken text-muted transition hover:brightness-95"
    >
      {children}
      {badge ? (
        <span className="type-caption absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-yellow px-1 font-bold text-ink">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function Hamburger() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}
