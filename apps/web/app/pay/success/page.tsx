"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { PrimaryButton } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <Suspense>
        <Success />
      </Suspense>
    </AppShell>
  );
}

function Success() {
  const { messages } = useI18n();
  const params = useSearchParams();
  const ticketId = params.get("ticketId");
  return (
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
  );
}
