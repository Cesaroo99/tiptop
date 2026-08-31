"use client";

import Link from "next/link";
import { Logo } from "./Logo";

export function AppHeader({
  location,
}: {
  location?: string | null;
}) {
  return (
    <header className="space-y-3 px-4 pt-2">
      <div className="flex items-center justify-between">
        <Logo size={36} />
        <div className="flex items-center gap-2">
          <HeaderIcon href="/notifications" label="Notifications" badge="5">
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
        <button
          type="button"
          className="flex flex-1 items-center gap-2 rounded-2xl bg-[var(--border)]/60 px-3 py-3 text-left text-sm text-muted"
        >
          <Pin />
          <span className="flex-1 truncate">{location || "Choisir une zone"}</span>
          <span>▾</span>
        </button>
        <Link
          href="/search"
          aria-label="Recherche"
          className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--border)]/60 text-muted"
        >
          <Search />
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
