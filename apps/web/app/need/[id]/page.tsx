"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { InterestedBadge } from "@/components/InterestedBadge";
import { MapThumb } from "@/components/MapThumb";
import { CardSkeleton, ErrorBanner, PrimaryButton, SecondaryButton } from "@/components/ui";
import { api, type OfferItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/lib/money";

export default function Page() {
  return (
    <AppShell>
      <OfferDetail />
    </AppShell>
  );
}

function OfferDetail() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const { formatPrice } = useMoney();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setOffer(await api<OfferItem>(`/offers/${id}`));
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function hide() {
    await api(`/offers/${id}/hide`, { method: "POST" });
    router.replace("/need?mine=1");
  }

  if (error) return <div className="px-4 py-4"><ErrorBanner message={error} onRetry={() => void load()} /></div>;
  if (!offer) return <div className="px-4 py-4"><CardSkeleton /></div>;

  return (
    <div className="space-y-4 px-4 py-4">
      {offer.imageUrl ? (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={offer.imageUrl} alt="" className="h-48 w-full rounded-card object-cover" />
          <span className="absolute left-2 top-2">
            <InterestedBadge variant="stamp" active={false} />
          </span>
        </div>
      ) : (
        <InterestedBadge variant="stamp" active={false} />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="type-caption text-muted">
            {offer.kind === "SERVICE" ? messages.need.service : messages.need.product}
          </p>
          <h1 className="type-h2 text-ink">{offer.title}</h1>
        </div>
        <p className="type-h3 shrink-0 text-accent">
          {formatPrice(offer.priceXaf, offer.currency)}
        </p>
      </div>
      {offer.description ? <p className="type-body text-ink">{offer.description}</p> : null}
      <div className="overflow-hidden rounded-card shadow-xs">
        <MapThumb lat={offer.latitude} lng={offer.longitude} city={offer.city} zone={offer.zone} className="h-40 w-full border-0" />
        <p className="type-caption bg-surface px-4 py-2.5 text-muted">
          {offer.placeLabel || offer.city}
          {offer.distanceLabel ? ` · ${offer.distanceLabel}` : ""}
        </p>
      </div>
      {offer.directionsUrl ? (
        <a
          href={offer.directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="tap-scale type-button block rounded-pill bg-accent px-6 py-3.5 text-center text-on-primary"
        >
          {messages.need.goThere}
        </a>
      ) : null}
      <Link href={`/u/${offer.seller.username}`} className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-xs">
        <Avatar src={offer.seller.avatarUrl} firstName={offer.seller.firstName} lastName={offer.seller.lastName} />
        <div className="min-w-0 flex-1">
          <p className="type-heading flex items-center gap-1 text-ink">
            {offer.shopName || `${offer.seller.firstName} ${offer.seller.lastName}`}
            {offer.seller.certified ? <CertifiedMark /> : null}
          </p>
          <p className="type-caption text-muted">
            {messages.need.seller} · @{offer.seller.username}
          </p>
        </div>
      </Link>
      {offer.isMine ? (
        <SecondaryButton onClick={() => void hide()}>{messages.need.hide}</SecondaryButton>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <InterestedBadge
            active={false}
            onClick={async () => {
              const conv = await api<{ id: string }>("/conversations/direct", {
                method: "POST",
                body: JSON.stringify({ userId: offer.seller.id }),
              });
              router.push(`/messages/${conv.id}`);
            }}
          />
          <PrimaryButton
            onClick={async () => {
              const conv = await api<{ id: string }>("/conversations/direct", {
                method: "POST",
                body: JSON.stringify({ userId: offer.seller.id }),
              });
              router.push(`/messages/${conv.id}`);
            }}
          >
            {messages.world.message}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
