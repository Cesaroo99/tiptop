"use client";

import { ComingSoon } from "@/components/ComingSoon";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  const { messages } = useI18n();
  return <ComingSoon title={messages.menu.payments} />;
}
