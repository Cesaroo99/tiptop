"use client";

import { AppShell } from "@/components/AppShell";
import { ComingSoon } from "@/components/ComingSoon";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  const { messages } = useI18n();
  return (
    <AppShell>
      <ComingSoon title={messages.nav.add} />
    </AppShell>
  );
}
