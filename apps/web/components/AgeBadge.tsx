import { ageCategoryLabel } from "@tiptop/domain";

export function AgeBadge({
  minAge,
  className = "",
}: {
  minAge?: number | null;
  className?: string;
}) {
  const label = ageCategoryLabel(minAge);
  if (!label) return null;
  return (
    <span
      className={`type-caption inline-flex shrink-0 items-center rounded-full bg-ink/80 px-2 py-[3px] font-semibold leading-none tracking-wide text-white/95 ${className}`}
    >
      {label}
    </span>
  );
}
