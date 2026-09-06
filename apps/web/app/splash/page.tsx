"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

const SPLASH_MS = 4000;

export default function SplashPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      if (user?.profileCompleted) router.replace("/");
      else if (user) router.replace("/onboarding");
      else router.replace("/login");
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, [loading, user, router]);

  return (
    <main
      data-testid="splash-screen"
      className="relative flex h-full flex-col items-center justify-center overflow-hidden bg-ink"
    >
      <div className="splash-glow pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full" />
      <div className="relative z-10 flex flex-col items-center">
        <SplashMark />
        <p className="splash-name mt-4 text-[34px] font-semibold tracking-tight text-[#00BAF2]">TipTop</p>
      </div>
    </main>
  );
}

function SplashMark() {
  return (
    <svg
      className="splash-mark h-[200px] w-[200px]"
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="splash-orbit" x1="8" y1="8" x2="72" y2="72">
          <stop stopColor="#E5F022" />
          <stop offset="1" stopColor="#00B5E2" />
        </linearGradient>
        <filter id="splash-ball-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g className="splash-globe">
        <circle className="splash-globe-line splash-globe-rim" cx="40" cy="40" r="26" />
        <ellipse className="splash-globe-line splash-globe-m1" cx="40" cy="40" rx="11" ry="26" />
        <ellipse className="splash-globe-line splash-globe-m2" cx="40" cy="40" rx="20" ry="26" />
        <ellipse className="splash-globe-line splash-globe-p1" cx="40" cy="28" rx="22" ry="6" />
        <ellipse className="splash-globe-line splash-globe-p2" cx="40" cy="40" rx="26" ry="7" />
        <ellipse className="splash-globe-line splash-globe-p3" cx="40" cy="52" rx="22" ry="6" />
        <path
          className="splash-globe-line splash-globe-p2"
          d="M22 34c6-4 12-2 16 3 5 6 12 5 20-2"
        />
      </g>

      <path
        className="splash-orbit splash-orbit-a"
        d="M40 12c18 0 28 12 28 28S54 68 36 68 12 56 12 40 22 12 40 12"
        stroke="url(#splash-orbit)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        className="splash-orbit splash-orbit-b"
        d="M18 28c12-16 36-16 50 0 10 12 6 32-8 40"
        stroke="url(#splash-orbit)"
        strokeWidth="4"
        strokeLinecap="round"
      />

      <g filter="url(#splash-ball-glow)">
        <g className="splash-ball-g splash-ball-g-lime">
          <circle cx="40" cy="40" r="6" fill="#C8F04A" />
        </g>
        <g className="splash-ball-g splash-ball-g-green">
          <circle cx="40" cy="40" r="7" fill="#7EE08A" />
        </g>
        <g className="splash-ball-g splash-ball-g-cyan">
          <circle cx="40" cy="40" r="4" fill="#00C2E8" />
        </g>
      </g>
    </svg>
  );
}
