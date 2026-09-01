"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode } from "react";
import { ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import type { PublicUser } from "@/lib/api";

export function isStaff(user: PublicUser | null): boolean {
  return user?.role === "ADMIN" || user?.role === "MODERATOR";
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { messages } = useI18n();
  const { user, loading } = useSession();
  const router = useRouter();
  const path = usePathname();

  if (loading) return <p className="p-4 text-sm text-muted">{messages.common.loading}</p>;
  if (!user) {
    router.replace("/login");
    return null;
  }
  if (!isStaff(user)) {
    return (
      <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
        <ScreenHeader title={messages.admin.forbidden} onBack={() => router.push("/menu")} />
        <p className="mt-6 text-sm text-muted">{messages.admin.forbiddenBody}</p>
      </main>
    );
  }

  const links = [
    { href: "/admin", label: messages.admin.home },
    { href: "/admin/users", label: messages.admin.users },
    { href: "/admin/posts", label: messages.admin.posts },
    { href: "/admin/events", label: messages.admin.events },
    { href: "/admin/payments", label: messages.admin.payments },
    { href: "/admin/likes", label: messages.admin.likes },
    { href: "/admin/reports", label: messages.admin.reports },
  ];

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-4">
      <ScreenHeader title={messages.admin.title} onBack={() => router.push("/menu")} />
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 text-sm">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-pill px-3 py-2 ${
              path === l.href ? "bg-accent text-white" : "bg-surface text-ink shadow-card"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}
