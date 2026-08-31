"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

export function PrimaryButton({
  children,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; children: ReactNode }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`w-full rounded-pill bg-accent py-3.5 text-base font-semibold text-white transition hover:brightness-95 disabled:opacity-50 ${props.className ?? ""}`}
    >
      {loading ? "…" : children}
    </button>
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
      className={`flex w-full items-center justify-between rounded-card bg-surface px-4 py-4 text-left shadow-card ${danger ? "text-danger" : "text-ink"}`}
    >
      {children}
    </button>
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
        <button type="button" aria-label="Retour" onClick={onBack} className="text-xl text-muted">
          ←
        </button>
      ) : null}
      <h1 className="flex-1 text-lg font-semibold text-ink">{title}</h1>
      {right}
    </header>
  );
}

export function Field({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label ? <span className="mb-1 block text-sm text-muted">{label}</span> : null}
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-ink placeholder:text-muted ${props.className ?? ""}`}
    />
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="mx-auto max-w-sm px-6 py-16 text-center">
      <p className="text-lg font-semibold text-ink">{title}</p>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[var(--border)] ${className ?? "h-24"}`} />;
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-4 rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="mt-2 font-semibold underline" onClick={onRetry}>
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-card bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-3 text-sm text-muted">{children}</div>
        <button type="button" className="mt-6 w-full rounded-pill bg-accent py-3 font-semibold text-white" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
