"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TicketScanner } from "@/components/TicketScanner";
import { EmptyState, Skeleton } from "@/components/ui";
import { api, type EventCard } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell chrome="nav">
      <ScanView />
    </AppShell>
  );
}

function ScanView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { messages } = useI18n();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    api<EventCard>(`/events/${id}`)
      .then((event) => {
        if (!event.isHost) {
          setAllowed(false);
          router.replace(`/events/${id}`);
          return;
        }
        setAllowed(true);
      })
      .catch(() => {
        setAllowed(false);
        router.replace(`/events/${id}`);
      });
  }, [id, router]);

  if (allowed === null) {
    return (
      <div className="space-y-3 px-4 py-6">
        <Skeleton className="h-10" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (!allowed) {
    return <EmptyState title={messages.booking.notHost} body={messages.booking.notHost} />;
  }
  return <TicketScanner eventId={id} onBack={() => router.push(`/events/${id}/manage`)} />;
}
