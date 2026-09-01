"use client";

import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function HelpPage() {
  const { messages } = useI18n();
  const router = useRouter();
  const paragraphs = [
    messages.helpPage.lead,
    messages.helpPage.otp,
    messages.helpPage.live,
    messages.helpPage.pay,
    messages.helpPage.likes,
    messages.helpPage.reviews,
    messages.helpPage.contact,
  ];
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.menu.help} onBack={() => router.back()} />
      <article className="space-y-3 rounded-card bg-surface p-5 text-sm leading-6 text-ink shadow-card">
        {paragraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </article>
    </main>
  );
}
