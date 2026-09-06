"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type OptionsSheetAction = {
  key: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
};

/**
 * Feuille d'options générique (menu « ... ») — Enregistrer/Partager/Signaler/
 * Bloquer/Modifier/Supprimer selon le contexte et les permissions (#20).
 * Portail vers document.body comme `Modal`, pour ne jamais rester piégée par
 * un ancêtre positionné.
 */
export function OptionsSheet({
  open,
  onClose,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  actions: OptionsSheetAction[];
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--scrim)] p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="sheet-panel w-full max-w-md rounded-t-xl bg-surface-elevated p-2 pb-8 shadow-elevated sm:rounded-xl sm:pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-0 mb-2 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
        {actions.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => {
              onClose();
              a.onClick();
            }}
            className={`tap-scale flex w-full items-center gap-3 rounded-xl px-4 py-3.5 text-left transition hover:bg-surface-sunken ${a.danger ? "text-danger" : "text-ink"}`}
          >
            {a.icon}
            <span className="type-body-sm font-semibold">{a.label}</span>
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
}
