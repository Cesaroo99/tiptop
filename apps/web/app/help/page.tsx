"use client";

import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function HelpPage() {
  const { messages } = useI18n();
  const router = useRouter();
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.menu.help} onBack={() => router.back()} />
      <article className="space-y-3 rounded-card bg-surface p-5 text-sm leading-6 text-ink shadow-card">
        <p>TipTop sert à sortir, rencontrer et vivre des expériences réelles.</p>
        <p>Connexion : numéro camerounais + code OTP. En développement, le code mock est 1234.</p>
        <p>Les sections Tickets, Events, Mood, etc. seront branchées dans les phases suivantes — elles n’affichent pas de fausses données.</p>
      </article>
    </main>
  );
}
