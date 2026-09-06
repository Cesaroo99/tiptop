import { remainingSeats } from "@tiptop/domain";
import { useI18n } from "@/lib/i18n";

export function seatsRemainingOf(capacity?: number | null, taken?: number, remaining?: number | null) {
  if (remaining != null) return remaining;
  return remainingSeats(capacity, taken ?? 0);
}

export function seatsLeftLabel(
  remaining: number | null | undefined,
  messages: { seatsLeft: string; seatsLeftOne: string; seatsFull: string },
): string | null {
  if (remaining == null) return null;
  if (remaining <= 0) return messages.seatsFull;
  if (remaining === 1) return messages.seatsLeftOne;
  return messages.seatsLeft.replace("{count}", String(remaining));
}

export function SeatsLeftBadge({
  remaining,
  className = "",
}: {
  remaining: number | null | undefined;
  className?: string;
}) {
  const { messages } = useI18n();
  const label = seatsLeftLabel(remaining, messages.world);
  if (!label) return null;
  const full = remaining != null && remaining <= 0;
  const low = remaining != null && remaining > 0 && remaining <= 5;
  return (
    <span
      className={`type-body-sm rounded-pill px-3 py-1.5 font-extrabold tracking-tight shadow-md ring-2 ring-white ${
        full ? "bg-danger text-white" : low ? "bg-yellow text-ink" : "bg-ink text-white"
      } ${className}`}
    >
      {!full && remaining != null && remaining > 0 ? "🔥 " : ""}
      {label}
    </span>
  );
}
