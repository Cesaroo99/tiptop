"use client";

import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TicketScanner } from "@/components/TicketScanner";

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
  return <TicketScanner eventId={id} onBack={() => router.push(`/events/${id}/manage`)} />;
}
