"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { BellIcon, ChevronDownIcon, MessageIcon, PinIcon, SearchIcon } from "./Icons";
import { Logo } from "./Logo";

export function AppHeader({
  location,
}: {
  location?: string | null;
}) {
  const { messages } = useI18n();
  const { user, refresh } = useSession();
  const [unread, setUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ unreadCount: number }>("/notifications")
      .then((d) => setUnread(d.unreadCount))
      .catch(() => setUnread(0));
    api<{ unreadTotal: number }>("/conversations")
      .then((d) => setChatUnread(d.unreadTotal ?? 0))
      .catch(() => setChatUnread(0));
  }, []);

  const available =
    user?.availability === "AVAILABLE" &&
    Boolean(user.availabilityUntil && new Date(user.availabilityUntil).getTime() > Date.now());

  async function toggleAvail() {
    if (busy) return;
    setBusy(true);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify(
          available ? { availability: "HIDDEN" } : { availability: "AVAILABLE", ttlHours: 4 },
        ),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="space-y-3 px-4 pb-1 pt-3">
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
      <div className="flex gap-2">
        <Link
          href="/zone"
          className="tap-scale type-body-sm flex flex-1 items-center gap-2 rounded-xl bg-surface-sunken px-3.5 py-3 text-left text-muted transition hover:brightness-95"
        >
          <PinIcon size={16} />
          <span className="flex-1 truncate">{location || messages.home.locationFallback}</span>
          <ChevronDownIcon size={14} />
        </Link>
        <Link
          href="/search"
          aria-label="Recherche"
          className="tap-scale grid h-12 w-12 place-items-center rounded-xl bg-surface-sunken text-muted transition hover:brightness-95"
        >
          <SearchIcon size={18} />
        </Link>
      </div>
      <button
        type="button"
        onClick={() => void toggleAvail()}
        className={`type-caption tap-scale inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 font-semibold transition ${available ? "bg-success-soft text-success" : "bg-surface-sunken text-muted"}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-success" : "bg-disabled"}`} aria-hidden />
        {available ? messages.world.available : messages.world.goAvailable}
      </button>
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
