"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export function LikeDialogs({
  transferName,
  buyOpen,
  onCloseTransfer,
  onConfirmTransfer,
  onCloseBuy,
}: {
  transferName: string | null;
  buyOpen: boolean;
  onCloseTransfer: () => void;
  onConfirmTransfer: () => void;
  onCloseBuy: () => void;
}) {
  const { messages } = useI18n();
  const router = useRouter();
  return (
    <>
      <Modal
        open={Boolean(transferName)}
        title={messages.social.transferTitle}
        onClose={onCloseTransfer}
        onConfirm={onConfirmTransfer}
        confirmLabel={messages.common.confirm}
      >
        <p>{messages.social.transferBody.replace("{name}", transferName ?? "")}</p>
        <Link href="/likes/buy" className="mt-3 inline-block font-semibold text-accent">
          {messages.wallet.buyInstead}
        </Link>
      </Modal>
      <Modal
        open={buyOpen}
        title={messages.wallet.needPack}
        onClose={onCloseBuy}
        onConfirm={() => router.push("/likes/buy")}
        confirmLabel={messages.wallet.buyCta}
      >
        {messages.wallet.needPackBody}
      </Modal>
    </>
  );
}

export function likeErrorKind(code: string): "transfer" | "buy" | null {
  if (code.includes("NO_UNITS")) return "buy";
  if (code.includes("TRANSFER")) return "transfer";
  return null;
}
