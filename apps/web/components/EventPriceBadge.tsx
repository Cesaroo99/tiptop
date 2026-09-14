"use client";

import { useI18n } from "@/lib/i18n";
import { formatFcfa } from "@/lib/time";

/** Prix figé en haut à droite de l’image — « Gratuit » si 0. */
export function EventPriceBadge({
  amount,
  className = "absolute right-2 top-2 z-[1] rounded-lg bg-accent px-2.5 py-1 font-bold text-white shadow-sm",
}: {
  amount?: number | null;
  className?: string;
}) {
  const { messages } = useI18n();
  const label = amount && amount > 0 ? formatFcfa(amount) : messages.world.free;
  return <span className={`type-caption ${className}`}>{label}</span>;
}
