"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function SplashPage() {
  const router = useRouter();
  const { messages } = useI18n();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user?.profileCompleted) router.replace("/");
      else if (user) router.replace("/onboarding");
      else router.replace("/login");
    }, 1680);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  return (
    <main
      data-testid="splash-screen"
      className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-ink"
    >
      <div className="splash-orb splash-orb-cyan absolute -left-16 -top-16 h-52 w-52 rounded-full bg-accent/25" />
      <div className="splash-orb splash-orb-yellow absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-yellow/25" />
      <div className="splash-glow absolute h-40 w-40 rounded-full" />
      <div className="relative z-10 flex flex-col items-center">
        <Logo size={88} withWordmark={false} className="splash-logo-mark" />
        <Logo size={44} className="splash-logo-word mt-6" />
        <p className="splash-tagline type-body-sm mt-3 font-semibold tracking-wide text-white/80">
          {messages.brand.tagline}
        </p>
      </div>
    </main>
  );
}
