"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PinIcon, PlusIcon } from "@/components/Icons";
import { BackButton, CardSkeleton, EmptyState, ErrorBanner, TextInput } from "@/components/ui";
import { api, type OfferItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/lib/money";
import { useSession } from "@/lib/session";

export default function Page() {
  return (
    <AppShell chrome="nav">
      <Suspense>
        <NeedScreen />
      </Suspense>
    </AppShell>
  );
}

function NeedScreen() {
  const { messages } = useI18n();
  const { formatPrice } = useMoney();
  const { user } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [kind, setKind] = useState(params.get("kind") ?? "");
  const [sort, setSort] = useState(params.get("sort") === "price" ? "price" : "near");
  const [maxKm, setMaxKm] = useState(params.get("maxKm") ?? "");
  const [mine, setMine] = useState(params.get("mine") === "1");
  const [items, setItems] = useState<OfferItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(next = { q, kind, sort, maxKm, mine }) {
    setError(null);
    const search = new URLSearchParams();
    if (next.q.trim()) search.set("q", next.q.trim());
    if (next.kind) search.set("kind", next.kind);
    search.set("sort", next.sort);
    if (next.maxKm) search.set("maxKm", next.maxKm);
    if (next.mine) search.set("mine", "1");
    if (user?.city) search.set("city", user.city);
    try {
      const data = await api<{ items: OfferItem[] }>(`/offers?${search.toString()}`);
      setItems(data.items);
    } catch {
      setError(messages.common.error);
      setItems([]);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.city]);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const search = new URLSearchParams();
    if (q.trim()) search.set("q", q.trim());
    if (kind) search.set("kind", kind);
    if (sort === "price") search.set("sort", "price");
    if (maxKm) search.set("maxKm", maxKm);
    if (mine) search.set("mine", "1");
    router.replace(`/need${search.toString() ? `?${search}` : ""}`);
    void load({ q, kind, sort, maxKm, mine });
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <BackButton className="-ml-2" />
          <h1 className="type-h1 truncate text-ink">{mine ? messages.need.myOffers : messages.need.title}</h1>
        </div>
        <Link
          href="/compose?type=offer"
          className="tap-scale type-button flex items-center gap-1.5 rounded-pill bg-accent px-3.5 py-2 text-on-primary"
        >
          <PlusIcon size={14} />
          {messages.need.listOffer}
        </Link>
      </div>
      <form onSubmit={apply} className="space-y-3">
        <TextInput
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={messages.need.searchPlaceholder}
          aria-label={messages.need.searchPlaceholder}
        />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {(
            [
              ["", messages.need.allKinds],
              ["PRODUCT", messages.need.product],
              ["SERVICE", messages.need.service],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value || "all"}
              type="button"
              onClick={() => setKind(value)}
              className={`type-caption tap-scale rounded-pill px-3.5 py-1.5 font-semibold ${
                kind === value ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSort("near")}
            className={`type-caption tap-scale flex-1 rounded-pill px-3 py-2 font-semibold ${
              sort === "near" ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
            }`}
          >
            {messages.need.nearby}
          </button>
          <button
            type="button"
            onClick={() => setSort("price")}
            className={`type-caption tap-scale flex-1 rounded-pill px-3 py-2 font-semibold ${
              sort === "price" ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
            }`}
          >
            {messages.need.cheapest}
          </button>
        </div>
        <div className="flex gap-2">
          <TextInput
            value={maxKm}
            onChange={(e) => setMaxKm(e.target.value)}
            placeholder={messages.need.maxKm}
            inputMode="numeric"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setMine((v) => !v)}
            className={`type-caption tap-scale rounded-pill px-3.5 py-2 font-semibold ${
              mine ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
            }`}
          >
            {messages.need.myOffers}
          </button>
        </div>
        <button type="submit" className="tap-scale type-button w-full rounded-pill bg-ink py-3 text-white">
          {messages.social.applySearch}
        </button>
      </form>

      {error ? <div className="mt-4"><ErrorBanner message={error} onRetry={() => void load()} /></div> : null}
      {items === null && !error ? (
        <div className="mt-4 space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState
          title={messages.need.empty}
          body={messages.need.emptyBody}
          action={
            <Link href="/compose?type=offer" className="type-body-sm font-semibold text-accent">
              {messages.need.listOffer}
            </Link>
          }
        />
      ) : null}
      <div className="mt-4 space-y-3">
        {items?.map((offer) => (
          <Link key={offer.id} href={`/need/${offer.id}`} className="tap-scale block overflow-hidden rounded-card bg-surface shadow-card">
            {offer.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={offer.imageUrl} alt="" className="h-32 w-full object-cover" />
            ) : null}
            <div className="space-y-1.5 px-4 py-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="type-heading text-ink">{offer.title}</p>
                <p className="type-heading shrink-0 text-accent">
                  {formatPrice(offer.priceXaf, offer.currency)}
                </p>
              </div>
              <p className="type-caption flex items-center gap-1 text-muted">
                <PinIcon size={11} />
                {offer.placeLabel || offer.city}
                {offer.distanceLabel ? ` · ${offer.distanceLabel}` : ""}
              </p>
              <p className="type-caption text-muted">
                {offer.shopName || `${offer.seller.firstName} ${offer.seller.lastName}`}
                {` · ${offer.kind === "SERVICE" ? messages.need.service : messages.need.product}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
