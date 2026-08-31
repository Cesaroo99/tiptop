"use client";

export function Logo({ size = 40, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-label="TipTop">
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden>
        <defs>
          <linearGradient id="ttg" x1="8" y1="8" x2="72" y2="72">
            <stop stopColor="#E5F022" />
            <stop offset="1" stopColor="#00B5E2" />
          </linearGradient>
        </defs>
        <path
          d="M40 12c18 0 28 12 28 28S54 68 36 68 12 56 12 40 22 12 40 12"
          stroke="url(#ttg)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M18 28c12-16 36-16 50 0 10 12 6 32-8 40"
          stroke="url(#ttg)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle cx="22" cy="24" r="6" fill="#C8F04A" />
        <circle cx="58" cy="40" r="7" fill="#7EE08A" />
        <circle cx="34" cy="62" r="4" fill="#00C2E8" />
      </svg>
      {withWordmark ? (
        <span className="text-2xl font-semibold tracking-tight text-accent">TipTop</span>
      ) : null}
    </div>
  );
}
