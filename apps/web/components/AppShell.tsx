"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { BottomNav, SideNav } from "./Nav";
import { AppHeader } from "./AppHeader";
import { Skeleton } from "./ui";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!user.profileCompleted) router.replace("/onboarding");
  }, [loading, user, router]);

  if (loading || !user || !user.profileCompleted) {
    return (
      <div className="mx-auto max-w-lg space-y-4 p-4">
        <Skeleton className="h-10" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const location = [user.city, user.zone].filter(Boolean).join(" - ");

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl">
      <SideNav />
      <div className="flex min-h-dvh flex-1 flex-col pb-24 md:pb-6">
        <AppHeader location={location} />
        <main className="flex-1">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
