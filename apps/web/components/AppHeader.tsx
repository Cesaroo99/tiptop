"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { Logo } from "./Logo";

export function AppHeader({
  location,
}: {
  location?: string | null;
}) {
  const { messages } = useI18n();
  const { user, refresh } = useSession();
  const [unread, setUnread] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ unreadCount: number }>("/notifications")
      .then((d) => setUnread(d.unreadCount))
      .catch(() => setUnread(0));
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
    <header className="space-y-3 px-4 pt-2">
      <div className="flex items-center justify-between">
        <Logo size={36} />
        <div className="flex items-center gap-2">
          <HeaderIcon href="/notifications" label="Notifications" badge={unread > 0 ? String(unread) : undefined}>
            <Bell />
          </HeaderIcon>
          <HeaderIcon href="/messages" label="Messages">
            <Chat />
          </HeaderIcon>
          <HeaderIcon href="/menu" label="Menu">
            <Hamburger />
          </HeaderIcon>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href="/zone"
          className="flex flex-1 items-center gap-2 rounded-2xl bg-[var(--border)]/60 px-3 py-3 text-left text-sm text-muted"
        >
          <Pin />
          <span className="flex-1 truncate">{location || messages.home.locationFallback}</span>
          <span>▾</span>
        </Link>
        <Link
          href="/search"
          aria-label="Recherche"
          className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--border)]/60 text-muted"
        >
          <Search />
        </Link>
      </div>
      <button
        type="button"
        onClick={() => void toggleAvail()}
        className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${available ? "bg-accent text-white" : "bg-[var(--border)] text-muted"}`}
      >
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
      className="relative grid h-10 w-10 place-items-center rounded-full bg-[var(--border)]/50 text-muted"
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-yellow px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function Bell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}
function Chat() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 16.5 4 20l3.8-1.4A8 8 0 1 0 5 16.5Z" />
    </svg>
  );
}
function Hamburger() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}
function Pin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2" />
    </svg>
  );
}
function Search() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
