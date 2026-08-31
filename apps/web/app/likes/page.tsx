"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PrimaryButton, ScreenHeader, Skeleton } from "@/components/ui";
import { api, type LikeWallet } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  const { messages } = useI18n();
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
      <p className="mb-4 text-sm text-muted">{messages.wallet.mockHint}</p>
      {!wallet ? <Skeleton className="h-40" /> : null}
      {wallet ? (
        <>
          <section className="grid grid-cols-3 gap-2 rounded-card bg-surface p-4 text-center shadow-card">
            <div>
              <p className="text-2xl font-semibold text-accent">{wallet.available}</p>
              <p className="text-xs text-muted">{messages.wallet.available}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{wallet.total}</p>
              <p className="text-xs text-muted">{messages.wallet.total}</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-ink">{wallet.allocations.length}</p>
              <p className="text-xs text-muted">{messages.wallet.allocated}</p>
            </div>
          </section>

          <h2 className="mb-2 mt-6 text-sm font-semibold text-accent">{messages.wallet.packs}</h2>
          <div className="space-y-2">
            {wallet.packs.map((p) => (
              <Link
                key={p.code}
                href={`/likes/buy?pack=${p.code}`}
                className="flex items-center justify-between rounded-card bg-surface p-4 shadow-card"
              >
                <div>
                  <p className="font-semibold">{messages.wallet.packLabel.replace("{units}", String(p.units))}</p>
                  <p className="text-xs text-muted">{messages.booking.amount.replace("{amount}", String(p.amountXaf))}</p>
                </div>
                <span className="text-sm font-semibold text-accent">{messages.wallet.buy}</span>
              </Link>
            ))}
          </div>

          <h2 className="mb-2 mt-6 text-sm font-semibold text-accent">{messages.wallet.allocated}</h2>
          {wallet.allocations.length === 0 ? (
            <p className="text-sm text-muted">{messages.wallet.emptyAlloc}</p>
          ) : (
            <div className="space-y-2">
              {wallet.allocations.map((a) => (
                <Link
                  key={a.unitId}
                  href={`/u/${a.toUser.username}`}
                  className="block rounded-card bg-surface p-4 shadow-card"
                >
                  <p className="font-semibold">
                    {a.toUser.firstName} {a.toUser.lastName}
                  </p>
                  <p className="text-xs text-muted">@{a.toUser.username}</p>
                </Link>
              ))}
            </div>
          )}

          <h2 className="mb-2 mt-6 text-sm font-semibold text-accent">{messages.wallet.history}</h2>
          {wallet.history.length === 0 ? (
            <p className="text-sm text-muted">{messages.wallet.emptyHistory}</p>
          ) : (
            <div className="space-y-2">
              {wallet.history.map((h) => (
                <article key={h.id} className="rounded-card bg-surface p-4 shadow-card">
                  <p className="font-semibold">{txLabel(h)}</p>
                  <p className="text-xs text-muted">{new Date(h.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}

          <div className="mt-8">
            <PrimaryButton onClick={() => router.push("/likes/buy")}>{messages.wallet.buyCta}</PrimaryButton>
          </div>
        </>
      ) : null}
    </main>
  );
}
