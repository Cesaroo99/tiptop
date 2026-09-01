"use client";

import { Modal } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function LikeDialogs({
  transferName,
  onCloseTransfer,
  onConfirmTransfer,
}: {
  transferName: string | null;
  buyOpen?: boolean;
  onCloseTransfer: () => void;
  onConfirmTransfer: () => void;
  onCloseBuy?: () => void;
}) {
  const { messages } = useI18n();
  return (
    <Modal
      open={Boolean(transferName)}
      title={messages.social.transferTitle}
      onClose={onCloseTransfer}
      onConfirm={onConfirmTransfer}
      confirmLabel={messages.common.confirm}
    >
      <p>{messages.social.transferBody.replace("{name}", transferName ?? "")}</p>
      <p className="mt-2 text-xs text-muted">{messages.social.likeExplain}</p>
    </Modal>
  );
}

export function likeErrorKind(code: string): "transfer" | "buy" | null {
  if (code.includes("NO_UNITS")) return "buy";
  if (code.includes("TRANSFER")) return "transfer";
  return null;
}
