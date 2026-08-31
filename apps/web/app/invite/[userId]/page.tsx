"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState, Modal, PrimaryButton, ScreenHeader } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type Relevant = {
  id: string;
  title: string;
  city: string;
  zone: string | null;
  startsAt: string;
  priceXaf: number;
  reason: string;
  eligible: boolean;
  host: { firstName: string; lastName: string };
};

export default function InvitePage() {
  const { userId } = useParams<{ userId: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const [events, setEvents] = useState<Relevant[] | null>(null);
  const [picked, setPicked] = useState<Relevant | null>(null);
  const [payer, setPayer] = useState<"FREE" | "HOST" | "GUEST">("FREE");
  const [soon, setSoon] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ items: Relevant[] }>(`/invitations/events-for/${userId}`)
      .then((d) => setEvents(d.items.filter((e) => e.eligible)))
      .catch(() => setEvents([]));
  }, [userId]);

  async function send() {
    if (!picked) return;
    if (picked.priceXaf > 0 && payer === "HOST") {
      setSoon(messages.world.payerHostLater);
      return;
    }
    setLoading(true);
    try {
      await api("/invitations", {
        method: "POST",
        body: JSON.stringify({
          inviteeId: userId,
          eventId: picked.id,
          payer: picked.priceXaf > 0 ? payer : "FREE",
        }),
      });
      setDone(true);
    } catch (e) {
      if (e instanceof ApiError && String(e.code).includes("PAYMENT")) {
        setSoon(messages.world.payerHostLater);
      } else {
        setSoon(messages.common.error);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.world.invite} onBack={() => router.back()} />
      {done ? (
        <EmptyState title={messages.world.inviteSent} body={messages.world.inviteSent} action={<PrimaryButton onClick={() => router.push("/tickets")}>{messages.world.tabInvites}</PrimaryButton>} />
      ) : !picked ? (
        <div className="space-y-3">
          <p className="text-sm text-muted">{messages.world.pickEvent}</p>
          {events && events.length === 0 ? <EmptyState title={messages.world.pickEvent} body={messages.world.pickEventEmpty} /> : null}
          {events?.map((e) => (
            <button
              key={e.id}
              type="button"
              onClick={() => {
                setPicked(e);
                setPayer(e.priceXaf > 0 ? "GUEST" : "FREE");
              }}
              className="block w-full rounded-card bg-surface p-4 text-left shadow-card"
            >
              <p className="font-semibold text-accent">{e.title}</p>
              <p className="text-xs text-muted">
                {new Date(e.startsAt).toLocaleString()} · {e.city}
                {e.priceXaf > 0 ? ` · ${e.priceXaf} FCFA` : ` · ${messages.world.free}`}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-semibold">{picked.title}</p>
          <p className="text-sm text-muted">{messages.world.pickPayer}</p>
          {(picked.priceXaf > 0 ? (["GUEST", "HOST"] as const) : (["FREE"] as const)).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPayer(p)}
              className={`block w-full rounded-card p-4 text-left shadow-card ${payer === p ? "bg-accent/10" : "bg-surface"}`}
            >
              {p === "FREE" ? messages.world.payerFree : p === "HOST" ? messages.world.payerHost : messages.world.payerGuest}
            </button>
          ))}
          <PrimaryButton loading={loading} onClick={() => void send()}>
            {messages.world.invite}
          </PrimaryButton>
        </div>
      )}
      <Modal open={Boolean(soon)} title="TipTop" onClose={() => setSoon(null)}>
        {soon}
      </Modal>
    </main>
  );
}
