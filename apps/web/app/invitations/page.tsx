"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Avatar, CertifiedMark } from "@/components/Avatar";
import { SocialInviteSheet } from "@/components/SocialInviteSheet";
import { Chip, EmptyState, ScreenHeader, CardSkeleton } from "@/components/ui";
import { api, type SocialInviteItem } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatDateTime } from "@/lib/time";

export default function Page() {
  return (
    <AppShell>
      <Suspense>
        <SocialInvitesScreen />
      </Suspense>
    </AppShell>
  );
}

function SocialInvitesScreen() {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [box, setBox] = useState<"received" | "sent">("received");
  const [items, setItems] = useState<SocialInviteItem[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [opened, setOpened] = useState<SocialInviteItem | null>(null);
  const [busy, setBusy] = useState(false);
  const openId = params.get("open");

  async function load(next = box) {
    const data = await api<{ items: SocialInviteItem[] }>(`/social-invites?box=${next}`);
    setItems(data.items);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box]);

  useEffect(() => {
    if (!openId) return;
    const hit = items?.find((i) => i.id === openId);
    if (hit) {
      setOpened(hit);
      return;
    }
    api<SocialInviteItem>(`/social-invites/${openId}`)
      .then(setOpened)
      .catch(() => undefined);
  }, [openId, items]);

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
            <button
              key={inv.id}
              type="button"
              onClick={() => setOpened(inv)}
              className="w-full rounded-card bg-surface p-4 text-left shadow-card"
            >
              <div className="flex items-center gap-3">
                <Link href={`/u/${peer.username}`} onClick={(e) => e.stopPropagation()}>
                  <Avatar src={peer.avatarUrl} firstName={peer.firstName} lastName={peer.lastName} size="md" />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="type-body-sm flex items-center gap-1 font-semibold text-ink">
                    {peer.firstName} {peer.lastName}
                    {peer.certified ? <CertifiedMark /> : null}
                  </p>
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
                <p className="type-caption mt-2 font-semibold text-accent">{messages.social.notifInviteConsult}</p>
              ) : null}
            </button>
          );
        })}
      </div>
      <SocialInviteSheet
        invitation={opened}
        open={Boolean(opened)}
        canRespond={box === "received" && opened?.status === "SENT"}
        busy={busy}
        onClose={() => setOpened(null)}
        onAccept={() => {
          if (!opened) return;
          setBusy(true);
          void act(opened.id, "accept").finally(() => setBusy(false));
        }}
        onRefuse={() => {
          if (!opened) return;
          setBusy(true);
          void act(opened.id, "refuse").finally(() => {
            setBusy(false);
            setOpened(null);
          });
        }}
      />
    </main>
  );
}
