"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { Avatar } from "./Avatar";
import { CalendarIcon, PinIcon } from "./Icons";
import { PrimaryButton, SecondaryButton } from "./ui";
import type { InvitationItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/lib/money";
import { sheetOverlayClass, useSheetPortal } from "@/lib/sheet-portal";
import { formatEventWhen } from "@/lib/time";

export function EventInvitationSheet({
  invitation,
  open,
  canRespond,
  busy,
  onClose,
  onAccept,
  onRefuse,
}: {
  invitation: InvitationItem | null;
  open: boolean;
  canRespond: boolean;
  busy?: boolean;
  onClose: () => void;
  onAccept: () => void;
  onRefuse: () => void;
}) {
  const { messages, locale } = useI18n();
  const { formatPrice } = useMoney();
  const portal = useSheetPortal();
  if (!open || !portal) return null;

  const payer =
    invitation?.payer === "HOST"
      ? messages.world.payerHost
      : invitation?.payer === "GUEST"
        ? messages.booking.intentGuestPays
        : messages.world.free;

  return createPortal(
    <div
      className={sheetOverlayClass(portal)}
      role="dialog"
      aria-modal
      aria-label={messages.social.notifInviteTitle}
      onClick={onClose}
    >
      <div
        className="sheet-panel max-h-[min(86dvh,640px)] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-surface px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="type-h3 text-ink">{messages.social.notifInviteTitle}</h2>
          <button type="button" onClick={onClose} className="type-caption font-semibold text-muted">
            {messages.common.close}
          </button>
        </div>
        {!invitation ? (
          <p className="type-body-sm text-muted">{messages.common.loading}</p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <Avatar firstName={invitation.inviter.firstName} lastName={invitation.inviter.lastName} size="md" />
              <p className="type-body-sm text-ink">
                <span className="font-semibold">
                  {invitation.inviter.firstName} {invitation.inviter.lastName}
                </span>{" "}
                {messages.social.notifInvite}
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl bg-surface-sunken">
              {invitation.event.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={invitation.event.imageUrl} alt="" className="h-36 w-full object-cover" />
              ) : null}
              <div className="space-y-1.5 p-3.5">
                <p className="type-h4 text-ink">{invitation.event.title}</p>
                <p className="type-caption flex items-center gap-1.5 text-muted">
                  <CalendarIcon size={13} />
                  {formatEventWhen(invitation.event.startsAt, locale)}
                </p>
                <p className="type-caption flex items-center gap-1.5 text-muted">
                  <PinIcon size={13} />
                  {[invitation.event.zone, invitation.event.city].filter(Boolean).join(" · ")}
                </p>
                <p className="type-caption font-semibold text-accent">
                  {invitation.event.priceXaf > 0
                    ? `${formatPrice(invitation.event.priceXaf, invitation.event.currency ?? "XAF")} · ${payer}`
                    : messages.world.free}
                </p>
                <Link href={`/events/${invitation.event.id}`} className="type-body-sm inline-block pt-1 font-semibold text-accent">
                  {messages.social.notifInviteSeeEvent}
                </Link>
              </div>
            </div>
            {invitation.status !== "PENDING" ? (
              <p className="type-body-sm mt-3 font-semibold text-muted">
                {invitation.status === "EXPIRED" || invitation.status === "REFUSED"
                  ? messages.social.notifInviteExpired
                  : invitation.status}
              </p>
            ) : null}
            {canRespond && invitation.status === "PENDING" ? (
              <div className="mt-5 flex gap-2">
                <SecondaryButton disabled={busy} onClick={onRefuse}>
                  {messages.world.refuse}
                </SecondaryButton>
                <PrimaryButton disabled={busy} onClick={onAccept}>
                  {messages.world.accept}
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
