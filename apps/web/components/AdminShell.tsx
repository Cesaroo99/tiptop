"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import type { PublicUser } from "@/lib/api";
import { canAccessAdmin } from "@tiptop/domain";
import { NAV, adminCopy } from "@/lib/admin-copy";

export function isStaff(user: PublicUser | null): boolean {
  return Boolean(user && canAccessAdmin(user.role));
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { messages } = useI18n();
  const { user, loading } = useSession();
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState("");

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

  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-3 py-3 md:px-6">
      <ScreenHeader title={adminCopy.command} onBack={() => router.push("/menu")} />
      <p className="mb-3 text-xs text-muted">
        {adminCopy.subtitle} · {user.role}
      </p>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim().length >= 2) router.push(`/admin/support?q=${encodeURIComponent(q.trim())}`);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={adminCopy.searchHint}
          className="flex-1 rounded-pill border border-[var(--border)] bg-surface px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-pill bg-accent px-3 py-2 text-sm text-on-primary">
          {adminCopy.search}
        </button>
      </form>
      <nav className="mb-4 flex gap-2 overflow-x-auto pb-1 text-xs md:flex-wrap md:overflow-visible">
        {NAV.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`whitespace-nowrap rounded-pill px-3 py-2 ${
              path === l.href || (l.href !== "/admin" && path.startsWith(`${l.href}/`))
                ? "bg-accent text-on-primary"
                : "bg-surface text-ink shadow-card"
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
