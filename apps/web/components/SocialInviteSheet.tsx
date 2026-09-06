"use client";

import { createPortal } from "react-dom";
import { Avatar, CertifiedMark } from "./Avatar";
import { PrimaryButton, SecondaryButton } from "./ui";
import type { SocialInviteItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { sheetOverlayClass, useSheetPortal } from "@/lib/sheet-portal";
import { formatDateTime } from "@/lib/time";

export function SocialInviteSheet({
  invitation,
  open,
  canRespond,
  busy,
  onClose,
  onAccept,
  onRefuse,
}: {
  invitation: SocialInviteItem | null;
  open: boolean;
  canRespond: boolean;
  busy?: boolean;
  onClose: () => void;
  onAccept: () => void;
  onRefuse: () => void;
}) {
  const { messages, locale } = useI18n();
  const portal = useSheetPortal();
  if (!open || !portal) return null;

  const contextLabel = invitation
    ? {
        RESTAURANT: messages.socialInvite.contextRestaurant,
        CAFE: messages.socialInvite.contextCafe,
        ACTIVITY: messages.socialInvite.contextActivity,
        MEETUP: messages.socialInvite.contextMeetup,
        WISH: messages.socialInvite.contextWish,
      }[invitation.context]
    : "";

  return createPortal(
    <div
      className={sheetOverlayClass(portal)}
      role="dialog"
      aria-modal
      aria-label={messages.socialInvite.consultTitle}
      onClick={onClose}
    >
      <div
        className="sheet-panel max-h-[min(80dvh,560px)] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="type-h3 text-ink">{messages.socialInvite.consultTitle}</h2>
          <button type="button" onClick={onClose} className="type-caption font-semibold text-muted">
            {messages.common.close}
          </button>
        </div>
        {!invitation ? (
          <p className="type-body-sm text-muted">{messages.common.loading}</p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Avatar
                src={invitation.inviter.avatarUrl}
                firstName={invitation.inviter.firstName}
                lastName={invitation.inviter.lastName}
                size="md"
              />
              <div>
                <p className="type-body-sm flex items-center gap-1 font-semibold text-ink">
                  {invitation.inviter.firstName} {invitation.inviter.lastName}
                  {invitation.inviter.certified ? <CertifiedMark /> : null}
                </p>
                <p className="type-caption text-muted">
                  {contextLabel}
                  {invitation.label ? ` · ${invitation.label}` : ""}
                </p>
              </div>
            </div>
            {invitation.message ? (
              <p className="type-body-sm mb-3 rounded-2xl bg-surface-sunken px-3.5 py-3 text-ink">{invitation.message}</p>
            ) : null}
            {invitation.wish ? (
              <p className="type-caption mb-3 font-semibold text-accent">{invitation.wish.title}</p>
            ) : null}
            <p className="type-caption text-muted">{formatDateTime(invitation.createdAt, locale)}</p>
            {canRespond && invitation.status === "SENT" ? (
              <div className="mt-5 flex gap-2">
                <SecondaryButton disabled={busy} onClick={onRefuse}>
                  {messages.socialInvite.refuse}
                </SecondaryButton>
                <PrimaryButton disabled={busy} onClick={onAccept}>
                  {messages.socialInvite.accept}
                </PrimaryButton>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>,
    portal,
  );
}
