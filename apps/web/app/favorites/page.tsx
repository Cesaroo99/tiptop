"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EventCard } from "@/components/EventCard";
import { EmptyState, ScreenHeader } from "@/components/ui";
import { api, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  const { messages } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<EventCardType[] | null>(null);

  useEffect(() => {
    api<{ items: EventCardType[] }>("/favorites")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]));
  }, []);

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.menu.favorites} onBack={() => router.back()} />
      {items && items.length === 0 ? <EmptyState title={messages.menu.favorites} body={messages.world.favoritesEmpty} /> : null}
      <div className="space-y-4">
        {items?.map((ev) => (
          <EventCard key={ev.id} event={ev} onChanged={(next) => setItems((cur) => cur?.map((e) => (e.id === next.id ? next : e)) ?? null)} />
        ))}
      </div>
    </main>
  );
}
