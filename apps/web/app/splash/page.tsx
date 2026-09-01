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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-white">
      <div className="absolute -left-16 -top-16 h-52 w-52 rounded-full bg-[#d7eefc]" />
      <div className="absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-[#d7eefc]" />
      <Logo size={52} />
    </main>
  );
}
