"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
};

export default function Page() {
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
      <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={messages.chat.searchContact} />
      {filtered.length === 0 ? <EmptyState title={messages.chat.newTitle} body={messages.world.contactsEmpty} /> : null}
      <div className="mt-4 space-y-2">
        {filtered.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => void open(c.id)}
            className="block w-full rounded-card bg-surface p-4 text-left shadow-card"
          >
            <p className="font-semibold text-accent">
              {c.firstName} {c.lastName} {c.certified ? "✓" : ""}
            </p>
            <p className="text-sm text-muted">{c.profession || c.city}</p>
          </button>
        ))}
      </div>
    </main>
  );
}
