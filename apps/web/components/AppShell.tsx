"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { BottomNav } from "./Nav";
import { AppHeader } from "./AppHeader";
import { Skeleton } from "./ui";
import { LikeMilestoneCelebration } from "./LikeMilestoneCelebration";

export function AppShell({
  children,
  fullBleed = false,
  chrome = "full",
}: {
  children: React.ReactNode;
  /** Écran plein cadre sans header (ex. flux Mood vertical immersif). Nav en overlay. */
  fullBleed?: boolean;
  /** `nav` : barre basse seulement — écrans de création (maquettes 21-22). */
  chrome?: "full" | "nav";
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
      <div className="space-y-4 p-4 pt-12">
        <Skeleton className="h-10" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const location = [user.city, user.zone].filter(Boolean).join(" - ");

  if (fullBleed) {
    return (
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        <LikeMilestoneCelebration />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/75 to-transparent pt-10">
          <div className="pointer-events-auto">
            <BottomNav />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {chrome === "full" ? <AppHeader location={location} /> : <div className="phone-safe-top" />}
      <main className="min-h-0 flex-1 overflow-y-auto pb-24">{children}</main>
      <LikeMilestoneCelebration />
      <BottomNav />
    </div>
  );
}
