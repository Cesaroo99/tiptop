"use client";

import { InterestedIcon } from "./Icons";
import { useI18n } from "@/lib/i18n";

export function InterestedBadge({
  active,
  count,
  onClick,
  variant = "action",
}: {
  active: boolean;
  count?: number;
  onClick?: () => void;
  variant?: "action" | "stamp";
}) {
  const { messages } = useI18n();
  const label = active ? messages.world.interestedBadge : messages.world.interested;

  if (variant === "stamp") {
    return (
      <span
        className={`type-caption inline-flex items-center gap-1 rounded-pill px-2.5 py-1 font-bold shadow-sm ring-1 ${
          active
            ? "bg-yellow text-ink ring-yellow"
            : "bg-white/92 text-ink ring-black/5 backdrop-blur-sm"
        }`}
      >
        <InterestedIcon size={13} />
        {messages.world.interested}
        {count != null && count > 0 ? (
          <span
            className={`grid min-w-[1.15rem] place-items-center rounded-full px-1 text-[10px] font-extrabold ${
              active ? "bg-ink text-yellow" : "bg-yellow text-ink"
            }`}
          >
            {count}
          </span>
        ) : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      aria-label={active ? messages.world.notInterested : messages.world.interested}
      aria-pressed={active}
      onClick={onClick}
      className={`tap-scale type-caption inline-flex h-10 items-center gap-1.5 rounded-pill px-3.5 font-semibold shadow-xs transition ${
        active ? "bg-yellow text-ink" : "border border-border bg-surface text-ink hover:bg-surface-sunken"
      }`}
    >
      <InterestedIcon size={15} />
      {label}
      {!active && count != null && count > 0 ? (
        <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 text-[10px] font-bold text-muted">{count}</span>
      ) : null}
    </button>
  );
}
