"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { EmptyState, ScreenHeader, TextInput } from "@/components/ui";
import { api, type ConversationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Contact = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  profession: string | null;
  city: string | null;
  avatarUrl?: string | null;
};

export default function Page() {
  return (
    <AppShell chrome="none">
      <NewChat />
    </AppShell>
  );
}

function NewChat() {
  const { messages } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Contact[]>([]);

  useEffect(() => {
    api<{ items: Contact[] }>("/contacts")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  async function open(userId: string) {
    const conv = await api<ConversationItem>("/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    router.replace(`/messages/${conv.id}`);
  }

  const filtered = items.filter((c) => {
    const hay = `${c.firstName} ${c.lastName} ${c.username}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.chat.newTitle} onBack={() => router.back()} />
      <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={messages.chat.searchContact} className="!rounded-full" />
      {filtered.length === 0 ? <EmptyState title={messages.chat.newTitle} body={messages.world.contactsEmpty} /> : null}
      <div className="mt-4 space-y-1">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => void open(c.id)}
            className="flex w-full items-center gap-3 rounded-[22px] px-3 py-3 text-left"
          >
            <Avatar src={c.avatarUrl} firstName={c.firstName} lastName={c.lastName} size="md" />
            <div className="min-w-0">
              <p className="type-body-sm flex items-center gap-1 font-semibold text-ink">
                {c.firstName} {c.lastName}
                {c.certified ? <CertifiedMark /> : null}
              </p>
              <p className="type-caption text-muted">{c.profession || c.city}</p>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}
