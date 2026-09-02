"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { Logo } from "./Logo";

/**
 * Rail secondaire desktop (#13, #48) : évite de centrer bêtement l'app
 * mobile dans une grande page blanche sur grand écran.
 */
export function DesktopRail() {
  const { messages } = useI18n();
  const shortcuts = [
    { href: "/events", label: messages.nav.events },
    { href: "/people", label: messages.world.peopleNearby },
    { href: "/wishes", label: messages.menu.wishes },
    { href: "/mood", label: messages.nav.mood },
    { href: "/search", label: messages.common.search },
  ];
  return (
    <aside className="hidden w-72 shrink-0 border-l border-divider px-6 py-6 xl:block">
      <div className="sticky top-6 space-y-6">
        <section className="rounded-card bg-gradient-to-br from-accent-soft to-surface p-5 shadow-xs">
          <Logo size={28} />
          <p className="type-body-sm mt-3 leading-6 text-muted">{messages.brand.tagline}</p>
        </section>
        <section>
          <p className="type-label mb-3 text-subtle">{messages.common.search}</p>
          <div className="space-y-1">
            {shortcuts.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="type-body-sm tap-scale block rounded-lg px-3 py-2.5 text-ink transition hover:bg-surface-sunken"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-card bg-surface p-4 shadow-xs">
          <p className="type-body-sm font-semibold text-ink">{messages.helpPage.lead}</p>
          <Link href="/help" className="type-caption mt-2 inline-block font-semibold text-accent">
            {messages.menu.help}
          </Link>
        </section>
      </div>
    </aside>
  );
}
