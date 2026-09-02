"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LikeCapital } from "@/components/LikeCapital";
import { LikeFaces, LikePlacedCard } from "@/components/LikeFaces";
import { ScreenHeader, Skeleton } from "@/components/ui";
import { api, type LikeWallet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/time";

type BoardRow = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  certified: boolean;
  totalSeconds: number;
  label: string;
};

export default function Page() {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [wallet, setWallet] = useState<LikeWallet | null>(null);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [windowKey, setWindowKey] = useState<"all" | "week" | "month">("all");

  useEffect(() => {
    api<LikeWallet>("/likes/wallet")
      .then(setWallet)
      .catch(() => setWallet(null));
  }, []);

  useEffect(() => {
    api<{ items: BoardRow[] }>(`/likes/leaderboard?window=${windowKey}`)
      .then((d) => setBoard(d.items ?? []))
      .catch(() => setBoard([]));
  }, [windowKey]);

  function txLabel(h: LikeWallet["history"][number]) {
    const name = h.toUser ? `${h.toUser.firstName} ${h.toUser.lastName}` : "…";
    if (h.kind === "PURCHASE") return messages.wallet.txPurchase.replace("{units}", String(h.units));
    if (h.kind === "ALLOCATE") return messages.wallet.txAllocate.replace("{name}", name);
    return messages.wallet.txRelease.replace("{name}", name);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.wallet.title} onBack={() => router.back()} />
      <p className="mb-4 type-body-sm leading-6 text-muted">{messages.wallet.oneLikeHint}</p>
      {!wallet ? <Skeleton className="h-40" /> : null}
      {wallet ? (
        <div className="space-y-4">
          {wallet.likeTime ? <LikeCapital time={wallet.likeTime} forSelf /> : null}
          <p className="type-caption text-muted">
            {messages.wallet.extraUnits.replace("{n}", String(wallet.available)).replace("{total}", String(wallet.total))}
          </p>
          <LikePlacedCard
            title={messages.wallet.placedTitle}
            person={wallet.placedOn ?? null}
            idle={messages.social.likeIdle}
          />
          <LikeFaces title={messages.wallet.receivedTitle} people={wallet.receivedFrom ?? []} />

          <section className="rounded-card bg-surface p-4 shadow-card">
            <h2 className="type-heading text-ink">{messages.likeTime.ranking}</h2>
            <div className="mt-3 flex gap-2">
              {(
                [
                  ["all", messages.likeTime.rankingAll],
                  ["week", messages.likeTime.rankingWeek],
                  ["month", messages.likeTime.rankingMonth],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setWindowKey(key)}
                  className={`rounded-pill px-3 py-1.5 text-xs font-semibold ${windowKey === key ? "bg-accent text-white" : "bg-accent/15 text-accent"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <ol className="mt-3 space-y-2">
              {board.map((row, i) => (
                <li key={row.id} className="flex items-baseline justify-between gap-2">
                  <Link href={`/u/${row.username}`} className="type-body-sm text-ink">
                    {i + 1}. {row.firstName} {row.lastName}
                  </Link>
                  <span className="type-meta text-accent">{row.label}</span>
                </li>
              ))}
            </ol>
          </section>

          <h2 className="pt-2 type-heading text-accent">{messages.wallet.history}</h2>
          {wallet.history.length === 0 ? (
            <p className="type-body-sm text-muted">{messages.wallet.emptyHistory}</p>
          ) : (
            <div className="space-y-2">
              {wallet.history
                .filter((h) => h.kind !== "PURCHASE")
                .map((h) => (
                  <article key={h.id} className="rounded-card bg-surface p-4 shadow-card">
                    <p className="font-semibold">{txLabel(h)}</p>
                    <p className="type-caption text-muted">{formatDateTime(h.createdAt, locale)}</p>
                  </article>
                ))}
            </div>
          )}

          <p className="pt-4 type-caption leading-5 text-muted">{messages.wallet.packsNote}</p>
          <Link href="/likes/buy" className="block text-center text-sm text-accent">
            {messages.wallet.buyTitle}
          </Link>
        </div>
      ) : null}
    </main>
  );
}
