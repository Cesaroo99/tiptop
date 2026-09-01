"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Overview = {
  users: number;
  blocked: number;
  posts: number;
  hiddenPosts: number;
  events: number;
  payments: number;
  openReports: number;
};

export default function Page() {
  const { messages } = useI18n();
  const [data, setData] = useState<Overview | null>(null);

  useEffect(() => {
    api<Overview>("/admin/overview")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  const cards = data
    ? [
        { href: "/admin/users", label: messages.admin.usersCount, value: data.users },
        { href: "/admin/users", label: messages.admin.blockedCount, value: data.blocked },
        { href: "/admin/posts", label: messages.admin.postsCount, value: data.posts },
        { href: "/admin/posts", label: messages.admin.hiddenCount, value: data.hiddenPosts },
        { href: "/admin/events", label: messages.admin.eventsCount, value: data.events },
        { href: "/admin/payments", label: messages.admin.paymentsCount, value: data.payments },
        { href: "/admin/reports", label: messages.admin.openReports, value: data.openReports },
      ]
    : [];

  return (
    <AdminShell>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="rounded-card bg-surface p-4 shadow-card">
            <p className="text-2xl font-semibold text-accent">{c.value}</p>
            <p className="text-xs text-muted">{c.label}</p>
          </Link>
        ))}
      </div>
    </AdminShell>
  );
}
