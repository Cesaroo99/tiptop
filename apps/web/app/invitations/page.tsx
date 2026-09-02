"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { Chip, EmptyState, ScreenHeader, CardSkeleton } from "@/components/ui";
import { api, type SocialInviteItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/time";

export default function Page() {
  return (
    <AppShell>
      <SocialInvitesScreen />
    </AppShell>
  );
}

function SocialInvitesScreen() {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [box, setBox] = useState<"received" | "sent">("received");
  const [items, setItems] = useState<SocialInviteItem[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function load(next = box) {
    const data = await api<{ items: SocialInviteItem[] }>(`/social-invites?box=${next}`);
    setItems(data.items);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  async function act(id: string, action: "accept" | "refuse") {
    const res = await api<SocialInviteItem & { conversationId?: string }>(`/social-invites/${id}/${action}`, {
      method: "POST",
    });
    if (action === "accept" && res.conversationId) {
      router.push(`/messages/${res.conversationId}`);
      return;
    }
    setNote(action === "accept" ? messages.socialInvite.accepted : messages.socialInvite.refused);
    await load();
  }

  const contextLabel: Record<SocialInviteItem["context"], string> = {
    RESTAURANT: messages.socialInvite.contextRestaurant,
    CAFE: messages.socialInvite.contextCafe,
    ACTIVITY: messages.socialInvite.contextActivity,
    MEETUP: messages.socialInvite.contextMeetup,
    WISH: messages.socialInvite.contextWish,
  };

  const statusLabel: Record<string, string> = {
    SENT: messages.socialInvite.statusSent,
    ACCEPTED: messages.socialInvite.accepted,
    REFUSED: messages.socialInvite.refused,
    EXPIRED: messages.socialInvite.expired,
    CANCELLED: messages.socialInvite.refused,
  };

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.socialInvite.pageTitle} onBack={() => router.back()} />
      <div className="mb-4 flex gap-2">
        <Chip active={box === "received"} onClick={() => setBox("received")}>
          {messages.socialInvite.receivedTab}
        </Chip>
        <Chip active={box === "sent"} onClick={() => setBox("sent")}>
          {messages.socialInvite.sentTab}
        </Chip>
      </div>
      {note ? <p className="mb-3 type-body-sm font-semibold text-accent">{note}</p> : null}
      {!items ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}
      {items && items.length === 0 ? (
        <EmptyState
          title={messages.socialInvite.pageTitle}
          body={box === "received" ? messages.socialInvite.empty : messages.socialInvite.emptySent}
          icon={<span className="text-2xl">💌</span>}
        />
      ) : null}
      <div className="space-y-3">
        {items?.map((inv) => {
          const peer = box === "received" ? inv.inviter : inv.invitee;
          const statusTone =
            inv.status === "ACCEPTED" ? "success" : inv.status === "REFUSED" || inv.status === "EXPIRED" ? "danger" : "info";
          return (
            <article key={inv.id} className="rounded-card bg-surface p-4 shadow-card">
              <div className="flex items-center gap-3">
                <Link href={`/u/${peer.username}`}>
                  <Avatar src={peer.avatarUrl} firstName={peer.firstName} lastName={peer.lastName} size="md" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${peer.username}`} className="type-body-sm flex items-center gap-1 font-semibold text-ink">
                    {peer.firstName} {peer.lastName}
                    {peer.certified ? <CertifiedMark /> : null}
                  </Link>
                  <p className="type-caption text-muted">
                    {contextLabel[inv.context]}
                    {inv.label ? ` · ${inv.label}` : ""}
                  </p>
                </div>
                <Chip tone={statusTone}>{statusLabel[inv.status] ?? inv.status}</Chip>
              </div>
              {inv.message ? <p className="type-body-sm mt-2.5 rounded-lg bg-surface-sunken p-3 text-ink">{inv.message}</p> : null}
              <p className="type-caption mt-2 text-muted">{formatDateTime(inv.createdAt, locale)}</p>
              {box === "received" && inv.status === "SENT" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    className="tap-scale type-button flex-1 rounded-pill bg-accent py-2.5 text-on-primary transition hover:bg-accent-hover"
                    onClick={() => void act(inv.id, "accept")}
                  >
                    {messages.socialInvite.accept}
                  </button>
                  <button
                    type="button"
                    className="tap-scale type-button flex-1 rounded-pill border border-border bg-surface py-2.5 text-ink transition hover:bg-surface-sunken"
                    onClick={() => void act(inv.id, "refuse")}
                  >
                    {messages.socialInvite.refuse}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </main>
  );
}
