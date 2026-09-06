"use client";

import { useEffect, useState } from "react";

export function TicketQr({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const remote = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(value)}`;
    void import("qrcode")
      .then((mod) => mod.default.toDataURL(value, { width: 280, margin: 2, errorCorrectionLevel: "M" }))
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(remote);
      });
    const fallback = window.setTimeout(() => {
      if (!cancelled) setSrc((cur) => cur ?? remote);
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [value]);

  return (
    <div className="mx-auto mt-6 w-56 rounded-2xl bg-white p-3 shadow-sm">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="QR" className="h-full w-full" />
      ) : (
        <div className="grid aspect-square place-items-center type-caption text-muted">QR…</div>
      )}
    </div>
  );
}
