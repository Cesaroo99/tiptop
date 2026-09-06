"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { PrimaryButton, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  role: string;
  status: string;
  profile: { city: string | null; zone: string | null } | null;
};

export default function Page() {
  const { messages } = useI18n();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Row[]>([]);

  async function load(query = q) {
    const data = await api<{ items: Row[] }>(`/admin/users?q=${encodeURIComponent(query)}`);
    setItems(data.items);
  }

  useEffect(() => {
    void load("").catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function patch(id: string, body: Record<string, unknown>) {
    await api(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    await load();
  }

  return (
    <AdminShell>
      <div className="mb-4 flex gap-2">
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={messages.admin.search} />
        <PrimaryButton className="!w-auto px-4" onClick={() => void load()}>
          {messages.common.search}
        </PrimaryButton>
      </div>
      <div className="space-y-2">
        {items.map((u) => (
          <article key={u.id} className="rounded-card bg-surface p-4 shadow-card">
            <p className="font-semibold">
              {u.firstName} {u.lastName} {u.certified ? "✓" : ""}
            </p>
            <p className="text-xs text-muted">
              @{u.username} · {u.role === "ADMIN" ? messages.admin.roleAdmin : u.role === "MODERATOR" ? messages.admin.roleMod : u.role} ·{" "}
              {u.status === "BLOCKED" ? messages.admin.statusBlocked : messages.admin.statusActive}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <button
                type="button"
                className="rounded-pill bg-[var(--border)] px-3 py-2"
                onClick={() => void patch(u.id, { certified: !u.certified })}
              >
                {u.certified ? messages.admin.uncertify : messages.admin.certify}
              </button>
              <button
                type="button"
                className="rounded-pill bg-[var(--border)] px-3 py-2"
                onClick={() => void patch(u.id, { status: u.status === "BLOCKED" ? "ACTIVE" : "BLOCKED" })}
              >
                {u.status === "BLOCKED" ? messages.admin.unblock : messages.admin.block}
              </button>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
