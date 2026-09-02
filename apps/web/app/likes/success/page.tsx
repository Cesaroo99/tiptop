"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PrimaryButton, ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <Suspense>
      <Success />
    </Suspense>
  );
}

function Success() {
  const { messages } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const units = params.get("units") ?? "0";
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.wallet.success} onBack={() => router.replace("/likes")} />
      <div className="px-2 py-12 text-center">
        <p className="text-4xl">✓</p>
        <h1 className="mt-4 text-xl font-semibold">{messages.wallet.success}</h1>
        <p className="mt-2 text-sm text-muted">{messages.wallet.successBody.replace("{units}", units)}</p>
        <div className="mx-auto mt-8 max-w-xs">
          <Link href="/likes">
            <PrimaryButton>{messages.wallet.seeWallet}</PrimaryButton>
          </Link>
        </div>
      </div>
    </main>
  );
}
