"use client";

/** Tailles standard (#20) : xs 24 · sm 32 · md 44 · lg 56 · xl 88. */
export const AVATAR_SIZES = { xs: 24, sm: 32, md: 44, lg: 56, xl: 88 } as const;
export type AvatarSize = keyof typeof AVATAR_SIZES;

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "TT";
}

const initialsFontBySize: Record<AvatarSize, string> = {
  xs: "text-[9px]",
  sm: "text-[10px]",
  md: "text-[13px]",
  lg: "text-base",
  xl: "text-2xl",
};

function resolveSize(size: number | AvatarSize): { px: number; preset: AvatarSize } {
  if (typeof size === "number") {
    const preset: AvatarSize = size <= 26 ? "xs" : size <= 36 ? "sm" : size <= 48 ? "md" : size <= 64 ? "lg" : "xl";
    return { px: size, preset };
  }
  return { px: AVATAR_SIZES[size], preset: size };
}

export function Avatar({
  src,
  firstName,
  lastName,
  size = "md",
  online,
  ring,
  className = "",
}: {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: number | AvatarSize;
  online?: boolean;
  ring?: "accent" | "yellow" | "none";
  className?: string;
}) {
  const { px, preset } = resolveSize(size);
  const ringClass =
    ring === "accent" ? "ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg)]" : ring === "yellow" ? "ring-2 ring-yellow ring-offset-2 ring-offset-[var(--bg)]" : "";
  return (
    <span className={`relative inline-grid shrink-0 ${className}`} style={{ width: px, height: px }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={`h-full w-full rounded-full object-cover ${ringClass}`}
        />
      ) : (
        <span
          className={`grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-accent/35 to-yellow/35 font-semibold text-ink ${initialsFontBySize[preset]} ${ringClass}`}
        >
          {initials(firstName, lastName)}
        </span>
      )}
      {online ? (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-[var(--bg)]" />
      ) : null}
    </span>
  );
}

export function CertifiedMark() {
  return (
    <svg className="inline-block align-[-2px] text-accent" width="14" height="14" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="8" fill="currentColor" />
      <path d="M4.6 8.2 6.7 10.3 11.4 5.6" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
