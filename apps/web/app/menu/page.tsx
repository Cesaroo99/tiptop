"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { CardButton, ScreenHeader } from "@/components/ui";
import { LikeCapital } from "@/components/LikeCapital";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function MenuPage() {
  const { messages } = useI18n();
  const { user, loading } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<{
    active: number;
    likeTime?: { totalSeconds: number; weekSeconds: number; label: string; weekLabel: string; lastMilestone: { id: string; label: string; achievedAt: string | null } | null };
  }>({ active: 0 });
  useEffect(() => {
    if (!user) return;
    api<{
      active: number;
      likeTime?: { totalSeconds: number; weekSeconds: number; label: string; weekLabel: string; lastMilestone: { id: string; label: string; achievedAt: string | null } | null };
    }>(`/likes/stats/${user.id}`)
      .then(setStats)
      .catch(() => undefined);
  }, [user]);

  if (loading) {
    return <p className="p-4 text-sm text-muted">{messages.common.loading}</p>;
  }
  if (!user) {
    router.replace("/login");
    return null;
  }

  const items: Array<{ href: string; label: string; fresh?: boolean }> = [
    ...(user.role === "ADMIN" || user.role === "MODERATOR"
      ? [{ href: "/admin", label: messages.menu.admin }]
      : []),
    { href: "/wishes", label: messages.menu.wishes },
    { href: "/likes", label: messages.menu.likes },
    { href: "/tickets", label: messages.menu.tickets, fresh: true },
    { href: "/favorites", label: messages.menu.favorites, fresh: true },
    { href: "/contacts", label: messages.menu.contacts },
    { href: "/payments", label: messages.menu.payments },
    { href: "/settings", label: messages.menu.settings },
    { href: "/help", label: messages.menu.help },
  ];

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.menu.title} onBack={() => router.back()} />
      <Link href={user ? `/u/${user.username}` : "/account"} className="mt-2 flex items-center gap-3 rounded-card bg-surface p-4 shadow-card">
        <Avatar src={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} size={56} />
        <div className="flex-1">
          <p className="flex items-center gap-1 font-semibold text-accent">
            {user.firstName} {user.lastName}
            {user.certified ? <CertifiedMark /> : null}
          </p>
          <p className="text-sm text-muted">@{user.username}</p>
        </div>
        <span className="text-accent">›</span>
      </Link>
      <Link href="/likes" className="mt-4 block">
        <LikeCapital time={stats.likeTime} forSelf />
      </Link>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <CardButton key={item.href} onClick={() => router.push(item.href)}>
            <span className="flex items-center gap-2">
              {item.label}
              {"fresh" in item && item.fresh ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">{messages.menu.newBadge}</span>
              ) : null}
            </span>
            <span>›</span>
          </CardButton>
        ))}
      </div>
    </main>
  );
}
