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

/**
 * Barre de navigation basse — 5 entrées identiques (Home / Mood / Ajouter /
 * Amies / Events), fidèle à la maquette fournie : même gabarit pour chaque
 * icône, pas de bouton flottant surélevé pour « Ajouter » (ce n'était pas
 * dans le design d'origine et cassait la cohérence visuelle de la barre).
 */
export function BottomNav() {
  const pathname = usePathname();
  const { messages } = useI18n();
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between rounded-[28px] bg-[var(--nav)] px-1 py-2.5 shadow-elevated">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={messages.nav[item.key]}
              className={`type-nav tap-scale flex min-w-[56px] flex-1 flex-col items-center gap-1 rounded-2xl py-1 transition ${active ? "text-accent" : "text-muted"}`}
            >
              <Icon active={active} />
              <span className="text-[10px]">{messages.nav[item.key]}</span>
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
    <nav className="hidden w-56 shrink-0 flex-col gap-1 border-r border-divider p-4 md:flex">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        if (item.key === "add") {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="tap-scale type-button mt-1 flex items-center justify-center gap-2 rounded-pill bg-accent px-3 py-2.5 text-on-primary shadow-sm transition hover:bg-accent-hover"
            >
              <Icon active={active} />
              {messages.nav[item.key]}
            </Link>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`type-body-sm tap-scale flex items-center gap-3 rounded-2xl px-3 py-2.5 font-medium transition ${active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface"}`}
          >
            <Icon active={active} />
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
      <circle cx="12" cy="12" r="8" fill={active ? "currentColor" : "none"} fillOpacity="0.18" />
      <circle cx="9" cy="10" r="1.1" fill="currentColor" />
      <circle cx="15" cy="10" r="1.1" fill="currentColor" />
      <path d="M8.5 14.5c1.2 1.4 5.8 1.4 7 0" />
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
      <path d="M15 18c.3-1.6 1.5-2.6 3-2.6 1.6 0 2.8 1 3.2 2.6" />
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
