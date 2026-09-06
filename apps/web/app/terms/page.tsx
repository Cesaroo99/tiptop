"use client";

import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function TermsPage() {
  const { messages } = useI18n();
  const router = useRouter();
  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.settings.terms} onBack={() => router.back()} />
      <article className="space-y-3 rounded-card bg-surface p-5 text-sm leading-6 text-ink shadow-card">
        <p>Version brouillon — à valider juridiquement avant production.</p>
        <p>La localisation précise n’est jamais partagée sans ton choix de précision (exact / zone / ville / masqué).</p>
        <p>Les likes sont des attributions transférables, pas un compteur de vanité. Pas de revente de données personnelles.</p>
      </article>
    </main>
  );
}
