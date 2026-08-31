"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

const items = [
  { href: "/", key: "home" as const, icon: HomeIcon },
  { href: "/mood", key: "mood" as const, icon: MoodIcon },
  { href: "/compose", key: "add" as const, icon: AddIcon },
  { href: "/people", key: "people" as const, icon: PeopleIcon },
  { href: "/events", key: "events" as const, icon: EventsIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const { messages } = useI18n();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 md:hidden">
      <div className="pointer-events-auto flex w-full max-w-md items-stretch justify-between rounded-[28px] bg-[var(--nav)] px-2 py-2 shadow-card">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[56px] flex-col items-center gap-1 rounded-2xl px-2 py-1 text-[11px] ${active ? "text-accent" : "text-muted"}`}
            >
              <Icon active={active} />
              {messages.nav[item.key]}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  const { messages } = useI18n();
  return (
    <nav className="hidden w-56 shrink-0 flex-col gap-1 p-4 md:flex">
      {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-2xl px-3 py-2 text-sm font-medium ${active ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface"}`}
          >
            {messages.nav[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </svg>
  );
}
function MoodIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8" fill={active ? "currentColor" : "none"} fillOpacity="0.15" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}
function AddIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="5" width="14" height="14" rx="3" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  );
}
function PeopleIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="9" r="3" fill={active ? "currentColor" : "none"} fillOpacity="0.2" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M4 18c.5-2.5 2.5-4 5-4s4.5 1.5 5 4" />
    </svg>
  );
}
function EventsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" fill={active ? "currentColor" : "none"} fillOpacity="0.15" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}
