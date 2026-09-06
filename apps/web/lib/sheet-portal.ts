"use client";

import { useEffect, useState } from "react";

/** Ancre la feuille dans le cadre téléphone, sinon le body (tests). */
export function useSheetPortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const phone = document.querySelector("[data-phone-device] .phone-screen");
    setTarget((phone as HTMLElement | null) ?? document.body);
  }, []);
  return target;
}

export function sheetOverlayClass(target: HTMLElement | null) {
  const inPhone = Boolean(target && target !== document.body && target.closest("[data-phone-device]"));
  return inPhone
    ? "absolute inset-0 z-50 flex items-end justify-center bg-[var(--scrim)]"
    : "fixed inset-0 z-50 flex items-end justify-center bg-[var(--scrim)]";
}
