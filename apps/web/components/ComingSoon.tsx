"use client";

import { useRouter } from "next/navigation";
import { EmptyState, ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function ComingSoon({ title }: { title: string }) {
  const { messages } = useI18n();
  const router = useRouter();
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={title} onBack={() => router.back()} />
      <EmptyState title={title} body={messages.menu.comingSoon} />
    </main>
  );
}
