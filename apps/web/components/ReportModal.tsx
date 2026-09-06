"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Modal } from "./ui";

export type ReportKind = "USER" | "POST" | "EVENT" | "MESSAGE" | "MOOD";

export function ReportModal({
  open,
  kind,
  targetUserId,
  postId,
  eventId,
  messageId,
  moodId,
  onClose,
  onSent,
}: {
  open: boolean;
  kind: ReportKind;
  targetUserId?: string;
  postId?: string;
  eventId?: string;
  messageId?: string;
  moodId?: string;
  onClose: () => void;
  onSent?: () => void;
}) {
  const { messages } = useI18n();
  const [sent, setSent] = useState(false);

  async function report(reason: "SPAM" | "ABUSE" | "FAKE" | "OTHER") {
    await api("/reports", {
      method: "POST",
      body: JSON.stringify({ kind, reason, targetUserId, postId, eventId, messageId, moodId }),
    });
    setSent(true);
    onSent?.();
  }

  function close() {
    setSent(false);
    onClose();
  }

  return (
    <Modal open={open} title={messages.admin.reportTitle} onClose={close}>
      {sent ? (
        <p>{messages.admin.reportSent}</p>
      ) : (
        <>
          <p className="mb-3">{messages.admin.reportBody}</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["SPAM", messages.admin.reasonSpam],
                ["ABUSE", messages.admin.reasonAbuse],
                ["FAKE", messages.admin.reasonFake],
                ["OTHER", messages.admin.reasonOther],
              ] as const
            ).map(([reason, label]) => (
              <button
                key={reason}
                type="button"
                className="rounded-pill bg-[var(--border)] px-3 py-2"
                onClick={() => void report(reason)}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </Modal>
  );
}
