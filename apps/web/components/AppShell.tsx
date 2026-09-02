"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { BottomNav, SideNav } from "./Nav";
import { AppHeader } from "./AppHeader";
import { DesktopRail } from "./DesktopRail";
import { Skeleton } from "./ui";
import { LikeMilestoneCelebration } from "./LikeMilestoneCelebration";

export function AppShell({
  children,
  fullBleed = false,
}: {
  children: React.ReactNode;
  /** Écran plein cadre sans header (ex. flux Mood vertical immersif, #4). Nav reste accessible en overlay. */
  fullBleed?: boolean;
}) {
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

  if (fullBleed) {
    return (
      <div className="mx-auto flex h-dvh max-w-6xl xl:max-w-7xl">
        <SideNav />
        <div className="relative mx-auto h-dvh w-full max-w-lg overflow-hidden md:border-x md:border-divider">
          <main className="h-full">{children}</main>
          <LikeMilestoneCelebration />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/70 to-transparent pt-10">
            <div className="pointer-events-auto">
              <BottomNav />
            </div>
          </div>
        </div>
        <DesktopRail />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl xl:max-w-7xl">
      <SideNav />
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col pb-24 md:border-x md:border-divider md:pb-6">
        <AppHeader location={location} />
        <main className="flex-1">{children}</main>
        <LikeMilestoneCelebration />
        <BottomNav />
      </div>
      <DesktopRail />
    </div>
  );
}
