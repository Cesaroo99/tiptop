"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LikeFaces, LikePlacedCard } from "@/components/LikeFaces";
import { LikeMeter } from "@/components/LikeMeter";
import { ScreenHeader, Skeleton } from "@/components/ui";
import { api, type LikeWallet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/time";

export default function Page() {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [wallet, setWallet] = useState<LikeWallet | null>(null);

  useEffect(() => {
    api<LikeWallet>("/likes/wallet")
      .then(setWallet)
      .catch(() => setWallet(null));
  }, []);

  function txLabel(h: LikeWallet["history"][number]) {
    const name = h.toUser ? `${h.toUser.firstName} ${h.toUser.lastName}` : "…";
    if (h.kind === "PURCHASE") return messages.wallet.txPurchase.replace("{units}", String(h.units));
    if (h.kind === "ALLOCATE") return messages.wallet.txAllocate.replace("{name}", name);
    return messages.wallet.txRelease.replace("{name}", name);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.wallet.title} onBack={() => router.back()} />
      <p className="mb-4 text-sm leading-6 text-muted">{messages.wallet.oneLikeHint}</p>
      {!wallet ? <Skeleton className="h-40" /> : null}
      {wallet ? (
        <div className="space-y-4">
          <LikePlacedCard
            title={messages.wallet.placedTitle}
            person={wallet.placedOn ?? null}
            idle={messages.social.likeIdle}
          />
          <LikeMeter
            forSelf
            stats={
              wallet.production ?? {
                active: wallet.receivedFrom?.length ?? 0,
                perHour: 0,
                perDay: 0,
                perMonth: 0,
              }
            }
          />
          <LikeFaces title={messages.wallet.receivedTitle} people={wallet.receivedFrom ?? []} />

          <h2 className="pt-2 text-sm font-semibold text-accent">{messages.wallet.history}</h2>
          {wallet.history.length === 0 ? (
            <p className="text-sm text-muted">{messages.wallet.emptyHistory}</p>
          ) : (
            <div className="space-y-2">
              {wallet.history
                .filter((h) => h.kind !== "PURCHASE")
                .map((h) => (
                  <article key={h.id} className="rounded-card bg-surface p-4 shadow-card">
                    <p className="font-semibold">{txLabel(h)}</p>
                    <p className="text-xs text-muted">{formatDateTime(h.createdAt, locale)}</p>
                  </article>
                ))}
            </div>
          )}

          <p className="pt-4 text-xs leading-5 text-muted">{messages.wallet.packsNote}</p>
          <Link href="/likes/buy" className="block text-center text-sm text-accent">
            {messages.wallet.buyTitle}
          </Link>
        </div>
      ) : null}
    </main>
  );
}
