"use client";

export function Logo({ size = 40, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  return (
    <div className="flex items-center gap-2" aria-label="TipTop">
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden>
        <defs>
          <linearGradient id="tt-orbit" x1="8" y1="4" x2="72" y2="76">
            <stop stopColor="#F5E400" />
            <stop offset="0.45" stopColor="#7BE04A" />
            <stop offset="1" stopColor="#00BAF2" />
          </linearGradient>
        </defs>
        <ellipse cx="40" cy="40" rx="26" ry="16" transform="rotate(-28 40 40)" stroke="url(#tt-orbit)" strokeWidth="5" />
        <ellipse cx="40" cy="40" rx="26" ry="16" transform="rotate(38 40 40)" stroke="url(#tt-orbit)" strokeWidth="5" />
        <circle cx="18" cy="28" r="6" fill="#F5E400" />
        <circle cx="62" cy="34" r="5.5" fill="#5EE07A" />
        <circle cx="48" cy="62" r="4.5" fill="#00BAF2" />
        <circle cx="30" cy="16" r="3.5" fill="#E8F07A" />
      </svg>
      {withWordmark ? (
        <span className="text-[1.65rem] font-semibold leading-none tracking-tight text-accent">TipTop</span>
      ) : null}
    </div>
  );
}
