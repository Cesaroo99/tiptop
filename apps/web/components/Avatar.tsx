"use client";

function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "TT";
}

export function Avatar({
  src,
  firstName,
  lastName,
  size = 44,
  online,
  ring,
  className = "",
}: {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  size?: number;
  online?: boolean;
  ring?: "accent" | "yellow" | "none";
  className?: string;
}) {
  const ringClass =
    ring === "accent" ? "ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg)]" : ring === "yellow" ? "ring-2 ring-yellow ring-offset-2 ring-offset-[var(--bg)]" : "";
  return (
    <span className={`relative inline-grid shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={`h-full w-full rounded-full object-cover ${ringClass}`}
        />
      ) : (
        <span
          className={`grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-accent/40 to-yellow/40 text-[11px] font-semibold text-ink ${ringClass}`}
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
