"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ui";
import { WishList } from "@/components/WishList";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function Page() {
  return (
    <AppShell>
      <WishesScreen />
    </AppShell>
  );
}

function WishesScreen() {
  const { messages } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  if (!user) return null;
  return (
    <div className="px-4 py-4">
      <ScreenHeader title={messages.wishes.title} onBack={() => router.back()} />
      <WishList ownerId={user.id} isSelf />
    </div>
  );
}
