"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { PrimaryButton, ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell chrome="nav">
      <Suspense>
        <Success />
      </Suspense>
    </AppShell>
  );
}

function Success() {
  const { messages } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const ticketId = params.get("ticketId");
  const eventId = params.get("eventId");
  return (
    <div>
      <ScreenHeader
        title={messages.booking.paySuccess}
        onBack={() => router.push(eventId ? `/events/${eventId}` : "/tickets")}
      />
      <div className="px-4 py-16 text-center">
      <p className="text-4xl">✓</p>
      <h1 className="mt-4 text-xl font-semibold">{messages.booking.paySuccess}</h1>
      <p className="mt-2 text-sm text-muted">{messages.booking.paySuccessBody}</p>
      <div className="mx-auto mt-8 max-w-xs">
        <Link href={ticketId ? `/tickets/${ticketId}` : "/tickets"}>
          <PrimaryButton>{messages.booking.seeTicket}</PrimaryButton>
        </Link>
      </div>
      </div>
    </div>
  );
}
