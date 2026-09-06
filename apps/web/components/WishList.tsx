"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Chip, EmptyState, PrimaryButton, SecondaryButton, TextInput } from "./ui";
import { SocialInviteModal } from "./SocialInviteModal";
import { PlusIcon } from "./Icons";

const CATEGORY_EMOJI: Record<string, string> = {
  EVENT: "🎵",
  PRODUCT: "🎁",
  RESTAURANT: "🍽️",
  ACTIVITY: "🎯",
  TRAVEL: "🏖️",
  EXPERIENCE: "✨",
  GIFT: "🎁",
  SERVICE: "🛎️",
  PLACE: "📍",
  SPORT: "🏎️",
  LEISURE: "🎬",
  OTHER: "💫",
};

const EXPERIENCE_CATS = new Set([
  "EVENT",
  "RESTAURANT",
  "ACTIVITY",
  "TRAVEL",
  "EXPERIENCE",
  "SPORT",
  "LEISURE",
  "PLACE",
]);

export type WishItem = {
  id: string;
  title: string;
  category: string;
  description: string;
  estimatedPriceXaf: number | null;
  city: string | null;
  visibility: string;
  priority: string;
};

const CATS = [
  "EVENT",
  "PRODUCT",
  "RESTAURANT",
  "ACTIVITY",
  "TRAVEL",
  "EXPERIENCE",
  "GIFT",
  "SERVICE",
  "PLACE",
  "SPORT",
  "LEISURE",
  "OTHER",
] as const;

export function WishList({ ownerId, isSelf }: { ownerId: string; isSelf: boolean }) {
  const { messages } = useI18n();
  const [items, setItems] = useState<WishItem[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [note, setNote] = useState<string | null>(null);
  const [inviteWish, setInviteWish] = useState<WishItem | null>(null);

  function catLabel(cat: string) {
    const key = `cat${cat}` as keyof typeof messages.wishes;
    const v = messages.wishes[key];
    return typeof v === "string" ? v : cat;
  }

  async function load() {
    const path = isSelf ? "/wishes/me" : `/users/${ownerId}/wishes`;
    const data = await api<WishItem[] | { items?: WishItem[] }>(path);
    setItems(Array.isArray(data) ? data : (data.items ?? []));
  }

  useEffect(() => {
    void load().catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, isSelf]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await api("/wishes", {
      method: "POST",
      body: JSON.stringify({ title, category }),
    });
    setTitle("");
    setAdding(false);
    await load();
  }

  async function offer(id: string) {
    await api(`/wishes/${id}/offer`, { method: "POST", body: JSON.stringify({ message: "" }) });
    setNote(messages.wishes.sent);
  }

  if (!items) return <p className="type-caption text-muted">{messages.common.loading}</p>;
  return (
    <div className="space-y-3">
      {isSelf ? (
        adding ? (
          <form onSubmit={create} className="space-y-3 rounded-card bg-surface p-4 shadow-card">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={messages.wishes.titleField} />
            <select
              className="type-body w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-ink"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_EMOJI[c]} {catLabel(c)}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <SecondaryButton type="button" onClick={() => setAdding(false)}>
                {messages.common.cancel}
              </SecondaryButton>
              <PrimaryButton type="submit">{messages.wishes.save}</PrimaryButton>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="tap-scale type-button flex w-full items-center justify-center gap-2 rounded-pill border-2 border-dashed border-accent/40 bg-accent-soft py-3.5 text-accent transition hover:bg-accent/15"
          >
            <PlusIcon size={16} />
            {messages.wishes.add}
          </button>
        )
      ) : null}
      {items.length === 0 ? (
        <EmptyState
          title={messages.wishes.title}
          body={isSelf ? messages.wishes.empty : messages.wishes.emptyPublic}
          icon={<span className="text-2xl">✨</span>}
        />
      ) : (
        items.map((w) => (
          <article key={w.id} className="rounded-card bg-surface p-4 shadow-card transition hover:shadow-sm">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-xl" aria-hidden>
                {CATEGORY_EMOJI[w.category] ?? "💫"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="type-caption font-semibold text-accent">{catLabel(w.category)}</p>
                <p className="type-heading mt-0.5 text-ink">{w.title}</p>
                {w.description ? <p className="type-body-sm mt-1 text-muted">{w.description}</p> : null}
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {w.estimatedPriceXaf ? <Chip>{w.estimatedPriceXaf.toLocaleString()} XAF</Chip> : null}
                  {w.city ? <Chip>{w.city}</Chip> : null}
                </div>
              </div>
            </div>
            {!isSelf ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="tap-scale type-button rounded-pill bg-accent px-4 py-2.5 text-on-primary transition hover:bg-accent-hover"
                  onClick={() => void offer(w.id)}
                >
                  {messages.wishes.offer}
                </button>
                {EXPERIENCE_CATS.has(w.category) ? (
                  <button
                    type="button"
                    className="tap-scale type-button rounded-pill border border-border bg-surface px-4 py-2.5 text-ink transition hover:bg-surface-sunken"
                    onClick={() => setInviteWish(w)}
                  >
                    {messages.wishes.inviteOut}
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                className="type-caption mt-3 font-semibold text-danger"
                onClick={async () => {
                  await api(`/wishes/${w.id}`, { method: "DELETE" });
                  await load();
                }}
              >
                {messages.wishes.delete}
              </button>
            )}
          </article>
        ))
      )}
      {note ? <p className="type-caption font-semibold text-accent">{note}</p> : null}
      <SocialInviteModal
        open={Boolean(inviteWish)}
        inviteeId={ownerId}
        defaultContext="WISH"
        defaultLabel={inviteWish?.title ?? ""}
        wishId={inviteWish?.id}
        onClose={() => setInviteWish(null)}
      />
    </div>
  );
}
