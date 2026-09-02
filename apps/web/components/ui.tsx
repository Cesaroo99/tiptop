"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftIcon, ChevronRightIcon, CloseIcon } from "./Icons";

/** Bouton d'action principale — un seul par écran/carte (#18, #56). */
export function PrimaryButton({
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; children: ReactNode }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`tap-scale type-button w-full rounded-pill bg-accent px-6 py-3.5 text-on-primary shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45 ${props.className ?? ""}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

/** Action secondaire — même famille que Primary mais poids visuel réduit. */
export function SecondaryButton({
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; children: ReactNode }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`tap-scale type-button w-full rounded-pill border border-border bg-surface px-6 py-3.5 text-ink transition hover:bg-surface-sunken disabled:cursor-not-allowed disabled:opacity-45 ${props.className ?? ""}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

/** Action discrète — pas de fond, texte accentué. */
export function GhostButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={`tap-scale type-button text-accent transition hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-45 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

/** Suppression / action dangereuse — jamais confondue avec une action neutre. */
export function DestructiveButton({
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={`tap-scale type-button w-full rounded-pill bg-danger px-6 py-3.5 text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

/** Bouton compact pour une action iconique isolée (partager, fermer, signaler…). */
export function IconButton({
  children,
  label,
  tone = "neutral",
  size = 40,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  label: string;
  tone?: "neutral" | "accent" | "danger";
  size?: number;
}) {
  const toneClass =
    tone === "accent"
      ? "bg-accent text-on-primary"
      : tone === "danger"
        ? "bg-danger-soft text-danger"
        : "bg-surface-sunken text-muted";
  return (
    <button
      type="button"
      aria-label={label}
      {...props}
      style={{ width: size, height: size, ...props.style }}
      className={`tap-scale grid shrink-0 place-items-center rounded-full transition hover:brightness-95 ${toneClass} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="mx-auto h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function CardButton({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tap-scale type-body flex w-full items-center justify-between rounded-xl bg-surface px-4 py-4 text-left shadow-xs transition hover:bg-surface-sunken ${danger ? "text-danger" : "text-ink"}`}
    >
      {children}
    </button>
  );
}

/** Chevron de navigation cohérent — à utiliser en fin de `CardButton`/lien de liste. */
export function NavChevron({ danger }: { danger?: boolean } = {}) {
  return <ChevronRightIcon size={18} className={danger ? "text-danger" : "text-subtle"} />;
}

/** Badge/Chip compact — statuts, catégories, filtres (#14, #38). */
export function Chip({
  children,
  active,
  onClick,
  tone = "neutral",
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "bg-success-soft text-success"
      : tone === "warning"
        ? "bg-warning-soft text-warning"
        : tone === "danger"
          ? "bg-danger-soft text-danger"
          : tone === "info"
            ? "bg-info-soft text-info"
            : active
              ? "bg-accent text-on-primary"
              : "bg-surface-sunken text-muted";
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={`tap-scale type-caption whitespace-nowrap rounded-pill px-3 py-1.5 font-semibold transition ${toneClass}`}
    >
      {children}
    </button>
  ) : (
    <span className={`type-caption inline-flex whitespace-nowrap rounded-pill px-3 py-1.5 font-semibold ${toneClass}`}>
      {children}
    </span>
  );
}

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center gap-3 px-4 pb-3 pt-2">
      {onBack ? (
        <button
          type="button"
          aria-label="Retour"
          onClick={onBack}
          className="tap-scale -ml-2 grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-surface-sunken"
        >
          <ArrowLeftIcon size={20} />
        </button>
      ) : null}
      <h1 className="type-h3 flex-1 truncate text-ink">{title}</h1>
      {right}
    </header>
  );
}

export function Field({
  label,
  helper,
  error,
  children,
}: {
  label?: string;
  helper?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label ? <span className="type-label mb-1.5 block text-subtle">{label}</span> : null}
      {children}
      {error ? (
        <span className="type-caption mt-1 block text-danger">{error}</span>
      ) : helper ? (
        <span className="type-caption mt-1 block text-muted">{helper}</span>
      ) : null}
    </label>
  );
}

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean },
) {
  const { invalid, ...rest } = props;
  return (
    <input
      {...rest}
      className={`type-body w-full rounded-xl border bg-surface px-4 py-3.5 text-ink transition placeholder:text-subtle focus:border-accent ${invalid ? "border-danger" : "border-border"} ${props.className ?? ""}`}
    />
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-accent-soft text-accent">
        {icon ?? <DefaultEmptyIcon />}
      </div>
      <p className="type-h4 text-ink">{title}</p>
      <p className="type-body-sm mt-2 text-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

function DefaultEmptyIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-xl ${className ?? "h-24"}`} />;
}

/** Skeleton reproduisant la structure avatar + lignes d'une carte sociale (#43). */
export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-card bg-surface p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="skeleton-shimmer h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
          <div className="skeleton-shimmer h-2.5 w-1/4 rounded-full" />
        </div>
      </div>
      <div className="skeleton-shimmer h-3 w-full rounded-full" />
      <div className="skeleton-shimmer h-3 w-4/5 rounded-full" />
      <div className="skeleton-shimmer h-40 w-full rounded-lg" />
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-4 rounded-xl bg-danger-soft px-4 py-3 type-body-sm text-danger">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="mt-2 font-semibold underline" onClick={onRetry}>
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

/**
 * Bottom sheet sur mobile (poignée, coins arrondis en haut), dialogue centré
 * sur desktop (#52). Un seul composant pour confirmations et formulaires courts.
 */
export function Modal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel,
  danger,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  danger?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!open || !mounted) return null;
  // Portail vers document.body : une modale ne doit jamais rester piégée par un
  // ancêtre positionné/avec filtre (ex. flux Mood plein cadre, #4) qui casserait
  // son overlay plein écran.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--scrim)] p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal
      onClick={onClose}
    >
      <div
        className="sheet-panel w-full max-w-md rounded-t-xl bg-surface-elevated p-6 pb-8 shadow-elevated sm:rounded-xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-3">
          <h2 className="type-h3 text-ink">{title}</h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onClose}
            className="tap-scale -mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-subtle transition hover:bg-surface-sunken"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="type-body-sm mt-3 text-muted">{children}</div>
        <div className="mt-6 flex gap-2">
          {onConfirm ? (
            <button
              type="button"
              onClick={onClose}
              className="tap-scale type-button flex-1 rounded-pill border border-border bg-surface py-3.5 text-ink transition hover:bg-surface-sunken"
            >
              Annuler
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm ?? onClose}
            className={`tap-scale type-button flex-1 rounded-pill py-3.5 text-on-primary transition ${danger ? "bg-danger hover:brightness-95" : "bg-accent hover:bg-accent-hover"}`}
          >
            {confirmLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
