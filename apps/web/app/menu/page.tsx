"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { CardButton, NavChevron, ScreenHeader } from "@/components/ui";
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
    return <p className="type-body-sm p-4 text-muted">{messages.common.loading}</p>;
  }
  if (!user) {
    router.replace("/login");
    return null;
  }

  const groups: Array<Array<{ href: string; label: string; fresh?: boolean }>> = [
    [
      { href: "/wishes", label: messages.menu.wishes },
      { href: "/invitations", label: messages.menu.invitations, fresh: true },
      { href: "/likes", label: messages.menu.likes },
    ],
    [
      { href: "/tickets", label: messages.menu.tickets, fresh: true },
      { href: "/favorites", label: messages.menu.favorites, fresh: true },
      { href: "/contacts", label: messages.menu.contacts },
      { href: "/payments", label: messages.menu.payments },
    ],
    [
      { href: "/settings", label: messages.menu.settings },
      { href: "/help", label: messages.menu.help },
    ],
  ];
  if (user.role === "ADMIN" || user.role === "MODERATOR") {
    groups.unshift([{ href: "/admin", label: messages.menu.admin }]);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.menu.title} onBack={() => router.back()} />
      <Link
        href={`/u/${user.username}`}
        className="tap-scale mt-2 flex items-center gap-3 rounded-card bg-surface p-4 shadow-card transition hover:shadow-elevated"
      >
        <Avatar src={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="type-heading flex items-center gap-1 truncate text-ink">
            {user.firstName} {user.lastName}
            {user.certified ? <CertifiedMark /> : null}
          </p>
          <p className="type-body-sm text-muted">@{user.username}</p>
        </div>
        <NavChevron />
      </Link>
      <Link href="/likes" className="mt-4 block">
        <LikeCapital time={stats.likeTime} forSelf />
      </Link>
      <div className="mt-6 space-y-6">
        {groups.map((group, i) => (
          <div key={i} className="space-y-2">
            {group.map((item) => (
              <CardButton key={item.href} onClick={() => router.push(item.href)}>
                <span className="flex items-center gap-2">
                  {item.label}
                  {item.fresh ? (
                    <span className="type-caption rounded-full bg-accent px-2 py-0.5 font-bold text-on-primary">
                      {messages.menu.newBadge}
                    </span>
                  ) : null}
                </span>
                <NavChevron />
              </CardButton>
            ))}
          </div>
        ))}
      </div>
    </main>
  );
}
