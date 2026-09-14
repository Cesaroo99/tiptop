"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { TodayRail } from "@/components/TodayRail";
import { ScreenHeader } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell chrome="nav">
      <TodayScreen />
    </AppShell>
  );
}

function TodayScreen() {
  const { messages } = useI18n();
  const router = useRouter();
  return (
    <div className="px-4 py-4">
      <ScreenHeader title={messages.intel.todayTitle} onBack={() => router.back()} />
      <div className="mt-3">
        <TodayRail />
      </div>
    </div>
  );
}
