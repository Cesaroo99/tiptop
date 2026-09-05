"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { useSession } from "@/lib/session";

export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) return;
      if (user?.profileCompleted) router.replace("/");
      else if (user) router.replace("/onboarding");
      else router.replace("/login");
    }, 900);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  return (
    <main className="relative flex h-full items-center justify-center overflow-hidden bg-ink">
      <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-accent/20" />
      <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-yellow/20" />
      <Logo size={52} />
    </main>
  );
}
