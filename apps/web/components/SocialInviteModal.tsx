"use client";

import { useState } from "react";
import { api, ApiError, type SocialInviteContext } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Modal, TextInput } from "./ui";

const CONTEXTS: SocialInviteContext[] = ["MEETUP", "RESTAURANT", "CAFE", "ACTIVITY"];

export function SocialInviteModal({
  open,
  inviteeId,
  defaultContext = "MEETUP",
  defaultLabel = "",
  wishId,
  onClose,
  onSent,
}: {
  open: boolean;
  inviteeId: string;
  defaultContext?: SocialInviteContext;
  defaultLabel?: string;
  wishId?: string;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { messages } = useI18n();
  const [context, setContext] = useState<SocialInviteContext>(defaultContext);
  const [label, setLabel] = useState(defaultLabel);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const contextLabels: Record<SocialInviteContext, string> = {
    RESTAURANT: messages.socialInvite.contextRestaurant,
    CAFE: messages.socialInvite.contextCafe,
    ACTIVITY: messages.socialInvite.contextActivity,
    MEETUP: messages.socialInvite.contextMeetup,
    WISH: messages.socialInvite.contextWish,
  };

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await api("/social-invites", {
        method: "POST",
        body: JSON.stringify({ inviteeId, context, label, message, wishId }),
      });
      setDone(true);
      onSent?.();
    } catch (e) {
      if (e instanceof ApiError && e.code === "INVITE_ALREADY_PENDING") {
        setError(messages.socialInvite.alreadyPending);
      } else if (e instanceof ApiError && e.code === "INVITE_RATE_LIMITED") {
        setError(messages.socialInvite.rateLimited);
      } else {
        setError(messages.common.error);
      }
    } finally {
      setBusy(false);
    }
  }

  function close() {
    setDone(false);
    setError(null);
    setLabel(defaultLabel);
    setMessage("");
    setContext(defaultContext);
    onClose();
  }

  return (
    <Modal
      open={open}
      title={messages.socialInvite.modalTitle}
      onClose={close}
      onConfirm={done ? undefined : () => void send()}
      confirmLabel={done ? messages.common.close : messages.socialInvite.send}
    >
      {done ? (
        <p className="type-body text-ink">{messages.socialInvite.sent}</p>
      ) : (
        <div className="space-y-3 text-left">
          {!wishId ? (
            <div className="flex flex-wrap gap-2">
              {CONTEXTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setContext(c)}
                  className={`rounded-pill px-3 py-1.5 text-sm ${context === c ? "bg-accent text-white" : "bg-[var(--border)] text-ink"}`}
                >
                  {contextLabels[c]}
                </button>
              ))}
            </div>
          ) : null}
          <TextInput
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={messages.socialInvite.labelPlaceholder}
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={messages.socialInvite.messagePlaceholder}
            className="min-h-20 w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 text-ink placeholder:text-muted"
          />
          {error ? <p className="type-caption text-danger">{error}</p> : null}
        </div>
      )}
    </Modal>
  );
}
