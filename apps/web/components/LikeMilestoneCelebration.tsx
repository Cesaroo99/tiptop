"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Modal } from "./ui";

type MilestoneItem = {
  id: string;
  achievedAt: string;
  message: string;
  label: string;
};

export function LikeMilestoneCelebration() {
  const { messages } = useI18n();
  const [queue, setQueue] = useState<MilestoneItem[]>([]);
  const current = queue[0] ?? null;

  useEffect(() => {
    api<{ items: MilestoneItem[] }>("/likes/milestones")
      .then((d) => setQueue(d.items ?? []))
      .catch(() => undefined);
  }, []);

  async function close() {
    if (!current) return;
    await api(`/likes/milestones/${current.id}/ack`, { method: "POST" }).catch(() => undefined);
    setQueue((q) => q.slice(1));
  }

  return (
    <Modal
      open={Boolean(current)}
      title={messages.likeTime.capital}
      onClose={() => void close()}
      confirmLabel={messages.likeTime.close}
    >
      {current ? (
        <div className="milestone-pop text-center">
          <p className="type-display text-accent">{current.label}</p>
          <p className="type-caption mt-1 text-muted">{messages.social.ofLikes}</p>
          <p className="type-body mt-4 text-ink">{current.message}</p>
        </div>
      ) : null}
    </Modal>
  );
}
