"use client";

import { useRef, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

const SWIPE_THRESHOLD = 90;

export function PersonSwipeDeck<T>({
  items,
  index,
  onIndexChange,
  peekSrc,
  fill = false,
  children,
}: {
  items: T[];
  index: number;
  onIndexChange: (next: number) => void;
  peekSrc: (item: T) => string | null | undefined;
  /** Occupe la hauteur restante (Amies) au lieu d’une carte compacte. */
  fill?: boolean;
  children: (item: T, index: number) => ReactNode;
}) {
  const { messages } = useI18n();
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; id: number } | null>(null);
  const count = items.length;
  const item = items[index];
  const prev = items[index - 1];
  const next = items[index + 1];

  function goNext() {
    onIndexChange(Math.min(count - 1, index + 1));
  }
  function goPrev() {
    onIndexChange(Math.max(0, index - 1));
  }

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    if ((e.target as HTMLElement).closest("a,button")) return;
    e.preventDefault();
    dragStart.current = { x: e.clientX, id: e.pointerId };
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (!dragStart.current || dragStart.current.id !== e.pointerId) return;
    setDragX(e.clientX - dragStart.current.x);
  }
  function onPointerEnd(e: React.PointerEvent<HTMLElement>) {
    if (!dragStart.current || dragStart.current.id !== e.pointerId) return;
    const dx = e.clientX - dragStart.current.x;
    dragStart.current = null;
    setDragging(false);
    if (dx <= -SWIPE_THRESHOLD && index < count - 1) goNext();
    else if (dx >= SWIPE_THRESHOLD && index > 0) goPrev();
    setDragX(0);
  }

  if (!item) return null;
  const prevSrc = prev ? peekSrc(prev) : null;
  const nextSrc = next ? peekSrc(next) : null;

  return (
    <div className={fill ? "flex h-full min-h-0 flex-col" : ""}>
      <div className={`relative mx-auto max-w-sm ${fill ? "flex min-h-0 w-full flex-1 flex-col" : ""}`}>
        {prevSrc ? (
          <div
            className={`pointer-events-none absolute -left-8 w-12 overflow-hidden rounded-[22px] opacity-30 blur-[1px] ${
              fill ? "top-[12%] h-[58%]" : "top-12 h-64"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={prevSrc} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        {nextSrc ? (
          <div
            className={`pointer-events-none absolute -right-8 w-12 overflow-hidden rounded-[22px] opacity-30 blur-[1px] ${
              fill ? "top-[12%] h-[58%]" : "top-12 h-64"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nextSrc} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <div
          className={`touch-pan-y select-none ${fill ? "flex min-h-0 flex-1 flex-col" : ""}`}
          style={{
            transform: `translateX(${dragX}px) rotate(${dragX / 28}deg)`,
            transition: dragging ? "none" : "transform 220ms var(--ease-standard)",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onDragStart={(e) => e.preventDefault()}
        >
          {children(item, index)}
        </div>
      </div>
      {count > 1 ? (
        <div className="mt-4 flex shrink-0 items-center justify-center gap-3">
          <button
            type="button"
            aria-label={messages.world.previousPerson}
            className="tap-scale grid h-11 w-11 place-items-center rounded-full bg-surface-sunken text-ink shadow-xs disabled:opacity-30"
            disabled={index === 0}
            onClick={goPrev}
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            className="type-caption tap-scale rounded-full bg-surface-sunken px-5 py-2.5 font-semibold text-ink shadow-xs"
            onClick={goNext}
            disabled={index >= count - 1}
          >
            {messages.world.passPerson}
          </button>
          <button
            type="button"
            aria-label={messages.world.nextPerson}
            className="tap-scale grid h-11 w-11 place-items-center rounded-full bg-accent text-on-primary shadow-sm disabled:opacity-30"
            disabled={index >= count - 1}
            onClick={goNext}
          >
            <ChevronRightIcon size={18} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
