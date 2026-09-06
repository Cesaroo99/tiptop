"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { EmptyState, ScreenHeader } from "@/components/ui";
import { api } from "@/lib/api";
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
  const { messages } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<Contact[] | null>(null);

  useEffect(() => {
    api<{ items: Contact[] }>("/contacts")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.menu.contacts} onBack={() => router.back()} />
      {items && items.length === 0 ? <EmptyState title={messages.menu.contacts} body={messages.world.contactsEmpty} /> : null}
      <div className="space-y-2">
        {items?.map((c) => (
          <Link key={c.id} href={`/u/${c.username}`} className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-card">
            <Avatar src={c.avatarUrl} firstName={c.firstName} lastName={c.lastName} size={48} />
            <div>
              <p className="font-semibold text-ink">
                {c.firstName} {c.lastName} {c.certified ? "✓" : ""}
              </p>
              <p className="text-sm text-muted">{c.profession || c.city}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
