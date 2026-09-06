"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

const SWIPE = 48;

export function PostMediaCarousel({
  images,
  className = "h-56",
  overlay,
}: {
  images: string[];
  className?: string;
  overlay?: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const drag = useRef<{ x: number; id: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const count = images.length;
  const current = images[Math.min(index, Math.max(0, count - 1))] ?? images[0];

  if (!current) return null;

  function go(next: number) {
    setIndex((i) => Math.max(0, Math.min(count - 1, next)));
  }

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if (count < 2) return;
    drag.current = { x: e.clientX, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    setDragX(e.clientX - drag.current.x);
  }
  function onPointerEnd(e: React.PointerEvent<HTMLElement>) {
    if (!drag.current || drag.current.id !== e.pointerId) return;
    const dx = e.clientX - drag.current.x;
    drag.current = null;
    setDragX(0);
    if (dx <= -SWIPE) go(index + 1);
    else if (dx >= SWIPE) go(index - 1);
  }

  return (
    <>
      <div className="relative">
        <button
          type="button"
          aria-label={count > 1 ? `${index + 1} / ${count}` : undefined}
          className={`relative block w-full overflow-hidden rounded-xl bg-surface-sunken ${className}`}
          onClick={() => setOpen(true)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current}
            alt=""
            draggable={false}
            className="h-full w-full object-cover"
            style={{ transform: dragX ? `translateX(${dragX * 0.35}px)` : undefined }}
          />
        </button>
        {overlay}
        {count > 1 ? (
          <>
            <div className="pointer-events-none absolute inset-x-0 bottom-2 z-[1] flex justify-center gap-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full ${i === index ? "w-4 bg-white" : "w-1.5 bg-white/45"}`}
                />
              ))}
            </div>
            {index > 0 ? (
              <button
                type="button"
                aria-label="Précédent"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index - 1);
                }}
                className="absolute left-2 top-1/2 z-[1] grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white"
              >
                <ChevronLeftIcon size={16} />
              </button>
            ) : null}
            {index < count - 1 ? (
              <button
                type="button"
                aria-label="Suivant"
                onClick={(e) => {
                  e.stopPropagation();
                  go(index + 1);
                }}
                className="absolute right-2 top-1/2 z-[1] grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/40 text-white"
              >
                <ChevronRightIcon size={16} />
              </button>
            ) : null}
          </>
        ) : null}
      </div>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[80] flex flex-col bg-ink"
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="phone-safe-top type-caption absolute right-4 top-3 z-10 rounded-full bg-white/15 px-3 py-1.5 font-semibold text-white"
              >
                ✕
              </button>
              <div
                className="flex min-h-0 flex-1 touch-pan-y items-center justify-center"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current} alt="" className="max-h-full max-w-full object-contain" draggable={false} />
              </div>
              {count > 1 ? (
                <div className="flex items-center justify-center gap-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => go(index - 1)}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white disabled:opacity-30"
                  >
                    <ChevronLeftIcon size={18} />
                  </button>
                  <p className="type-caption min-w-[3rem] text-center font-semibold text-white">
                    {index + 1} / {count}
                  </p>
                  <button
                    type="button"
                    disabled={index >= count - 1}
                    onClick={() => go(index + 1)}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white disabled:opacity-30"
                  >
                    <ChevronRightIcon size={18} />
                  </button>
                </div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
