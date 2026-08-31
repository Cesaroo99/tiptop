"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CardButton, ScreenHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function MenuPage() {
  const { messages } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ perHour: 0, perDay: 0, perMonth: 0 });
  useEffect(() => {
    if (!user) return;
    api<{ perHour: number; perDay: number; perMonth: number }>(`/likes/stats/${user.id}`)
      .then(setStats)
      .catch(() => undefined);
  }, [user]);

  if (!user) {
    router.replace("/login");
    return null;
  }

  const items = [
    { href: "/tickets", label: messages.menu.tickets },
    { href: "/favorites", label: messages.menu.favorites },
    { href: "/contacts", label: messages.menu.contacts },
    { href: "/payments", label: messages.menu.payments },
    { href: "/settings", label: messages.menu.settings },
    { href: "/help", label: messages.menu.help },
  ];

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.menu.title} onBack={() => router.back()} />
      <Link href={user ? `/u/${user.username}` : "/account"} className="mt-2 flex items-center gap-3 rounded-card bg-surface p-4 shadow-card">
        <div className="h-14 w-14 rounded-full bg-accent/20" />
        <div className="flex-1">
          <p className="font-semibold text-accent">
            {user.firstName} {user.lastName} {user.certified ? "✓" : ""}
          </p>
          <p className="text-sm text-muted">@{user.username}</p>
        </div>
        <span className="text-muted">›</span>
      </Link>
      <section className="mt-4 rounded-card bg-surface p-4 shadow-card">
        <p className="mb-3 text-sm text-accent">{messages.menu.likes}</p>
        <div className="grid grid-cols-3 text-center">
          <div>
            <p className="text-xl font-semibold text-accent">{stats.perHour}</p>
            <p className="text-xs text-muted">{messages.menu.perHour}</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-accent">{stats.perDay}</p>
            <p className="text-xs text-muted">{messages.menu.perDay}</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-accent">{stats.perMonth}</p>
            <p className="text-xs text-muted">{messages.menu.perMonth}</p>
          </div>
        </div>
      </section>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <CardButton key={item.href} onClick={() => router.push(item.href)}>
            <span>{item.label}</span>
            <span>›</span>
          </CardButton>
        ))}
      </div>
    </main>
  );
}
