"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, HeartIcon, SparklesIcon, UsersIcon } from "@/components/Icons";
import { PrimaryButton, ScreenHeader, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const SLIDES = [
  { icon: SparklesIcon, titleKey: "slide1Title", bodyKey: "slide1Body" },
  { icon: CalendarIcon, titleKey: "slide2Title", bodyKey: "slide2Body" },
  { icon: UsersIcon, titleKey: "slide3Title", bodyKey: "slide3Body" },
  { icon: HeartIcon, titleKey: "slide4Title", bodyKey: "slide4Body" },
] as const;

/**
 * Onboarding en deux temps (#70) : d'abord expliquer le concept TipTop
 * ("passer du virtuel au réel"), pas une présentation générique de réseau
 * social — puis seulement ensuite compléter le profil. Affiché une seule
 * fois : l'AppShell redirige déjà ici tant que `profileCompleted` est faux.
 */
export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  if (step < SLIDES.length) {
    return <ConceptSlide step={step} onNext={() => setStep((s) => s + 1)} onSkip={() => setStep(SLIDES.length)} />;
  }
  return <ProfileForm />;
}

function ConceptSlide({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const { messages } = useI18n();
  const slide = SLIDES[step];
  const Icon = slide.icon;
  const last = step === SLIDES.length - 1;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-6 py-8">
      <div className="flex justify-end">
        <button type="button" onClick={onSkip} className="type-body-sm font-semibold text-muted">
          {messages.onboarding.skip}
        </button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-accent-soft text-accent">
          <Icon size={40} />
        </div>
        <h1 className="type-h2 mt-8 text-ink">{messages.onboarding[slide.titleKey]}</h1>
        <p className="type-body mt-3 text-muted">{messages.onboarding[slide.bodyKey]}</p>
      </div>
      <div className="mb-6 flex items-center justify-center gap-2">
        {SLIDES.map((_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-accent" : "w-1.5 bg-border"}`} />
        ))}
      </div>
      <PrimaryButton onClick={onNext}>{last ? messages.onboarding.getStarted : messages.onboarding.next}</PrimaryButton>
    </main>
  );
}

function ProfileForm() {
  const { messages } = useI18n();
  const { user, refresh } = useSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [profession, setProfession] = useState(user?.profession || "");
  const [city, setCity] = useState(user?.city || "Yaoundé");
  const [zone, setZone] = useState(user?.zone || "Carrefour Damas");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName, profession, city, zone }),
      });
      await refresh();
      router.replace("/");
    } catch {
      setError(messages.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <ScreenHeader title={messages.onboarding.title} />
      <p className="px-2 text-sm text-muted">{messages.onboarding.subtitle}</p>
      <form onSubmit={save} className="mt-6 space-y-4 px-2">
        <TextInput placeholder={messages.account.firstName} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <TextInput placeholder={messages.account.lastName} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <TextInput placeholder={messages.account.profession} value={profession} onChange={(e) => setProfession(e.target.value)} />
        <TextInput placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
        <TextInput placeholder="Zone" value={zone} onChange={(e) => setZone(e.target.value)} />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <PrimaryButton type="submit" loading={loading}>
          {messages.onboarding.continue}
        </PrimaryButton>
      </form>
    </main>
  );
}
