"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { EmptyState, PrimaryButton, TextInput } from "./ui";
import { SocialInviteModal } from "./SocialInviteModal";

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
          <form onSubmit={create} className="space-y-2 rounded-card bg-surface p-4 shadow-card">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={messages.wishes.titleField} />
            <select
              className="w-full rounded-2xl bg-[var(--border)] px-3 py-3"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {catLabel(c)}
                </option>
              ))}
            </select>
            <PrimaryButton type="submit">{messages.wishes.save}</PrimaryButton>
          </form>
        ) : (
          <PrimaryButton onClick={() => setAdding(true)}>{messages.wishes.add}</PrimaryButton>
        )
      ) : null}
      {items.length === 0 ? (
        <EmptyState title={messages.wishes.title} body={isSelf ? messages.wishes.empty : messages.wishes.emptyPublic} />
      ) : (
        items.map((w) => (
          <article key={w.id} className="rounded-card bg-surface p-4 shadow-card">
            <p className="type-caption text-accent">{catLabel(w.category)}</p>
            <p className="type-heading mt-1 text-ink">{w.title}</p>
            {w.description ? <p className="type-body-sm mt-1 text-muted">{w.description}</p> : null}
            {w.estimatedPriceXaf ? <p className="type-caption mt-1 text-muted">{w.estimatedPriceXaf} XAF</p> : null}
            {!isSelf ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => void offer(w.id)}
                >
                  {messages.wishes.offer}
                </button>
                {EXPERIENCE_CATS.has(w.category) ? (
                  <button
                    type="button"
                    className="rounded-pill bg-[var(--border)] px-4 py-2 text-sm font-semibold text-ink"
                    onClick={() => setInviteWish(w)}
                  >
                    {messages.wishes.inviteOut}
                  </button>
                ) : null}
              </div>
            ) : (
              <button
                type="button"
                className="mt-3 text-sm text-danger"
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
      {note ? <p className="type-caption text-accent">{note}</p> : null}
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
