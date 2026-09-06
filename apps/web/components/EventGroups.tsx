"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Avatar } from "./Avatar";
import { MessageIcon, PlusIcon, UsersIcon } from "./Icons";
import { Modal } from "./ui";

export type EventGroupItem = {
  id: string;
  name: string;
  conversationId: string | null;
  memberCount: number;
  viewerStatus: "INVITED" | "JOINED" | "DECLINED" | "LEFT" | null;
  viewerRole: "HOST" | "ADMIN" | "MEMBER" | null;
  canInvite: boolean;
  canAdmin: boolean;
  canLeave: boolean;
  canRespond: boolean;
  members: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
    status: string;
  }>;
};

type Candidate = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

export function EventGroups({ eventId, isHost }: { eventId: string; isHost: boolean }) {
  const { messages } = useI18n();
  const router = useRouter();
  const [allowGroups, setAllowGroups] = useState<boolean | null>(null);
  const [items, setItems] = useState<EventGroupItem[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [inviteFor, setInviteFor] = useState<EventGroupItem | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);

  async function load() {
    const data = await api<{ allowGroups: boolean; items: EventGroupItem[] }>(`/events/${eventId}/groups`);
    setAllowGroups(data.allowGroups);
    setItems(data.items);
  }

  useEffect(() => {
    void load().catch(() => {
      setAllowGroups(false);
      setItems([]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  async function enable() {
    setBusy(true);
    try {
      await api(`/events/${eventId}`, { method: "PATCH", body: JSON.stringify({ allowGroups: true }) });
      setAllowGroups(true);
    } finally {
      setBusy(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await api<EventGroupItem>(`/events/${eventId}/groups`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      setItems((cur) => [...cur, created]);
      setName("");
      setCreating(false);
    } finally {
      setBusy(false);
    }
  }

  async function act(groupId: string, action: "accept" | "decline" | "leave") {
    setBusy(true);
    try {
      if (action === "decline") {
        await api(`/events/${eventId}/groups/${groupId}/decline`, { method: "POST" });
        setItems((cur) => cur.map((g) => (g.id === groupId ? { ...g, viewerStatus: "DECLINED", canRespond: false } : g)));
      } else {
        const next = await api<EventGroupItem>(`/events/${eventId}/groups/${groupId}/${action}`, { method: "POST" });
        setItems((cur) => cur.map((g) => (g.id === groupId ? next : g)));
      }
    } finally {
      setBusy(false);
    }
  }

  async function openChat(group: EventGroupItem) {
    const conv = await api<{ id: string }>(`/events/${eventId}/groups/${group.id}/conversation`, { method: "POST" });
    router.push(`/messages/${conv.id}`);
  }

  async function openInvite(group: EventGroupItem) {
    setInviteFor(group);
    setCandidates(null);
    const data = await api<{ items: Candidate[] }>(`/events/${eventId}/groups/${group.id}/candidates`);
    setCandidates(data.items);
  }

  async function invite(userId: string) {
    if (!inviteFor) return;
    setBusy(true);
    try {
      await api(`/events/${eventId}/groups/${inviteFor.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      setCandidates((cur) => (cur ?? []).filter((c) => c.id !== userId));
    } finally {
      setBusy(false);
    }
  }

  async function toggleAdmin(group: EventGroupItem, userId: string, admin: boolean) {
    const next = await api<EventGroupItem>(`/events/${eventId}/groups/${group.id}/admins`, {
      method: "POST",
      body: JSON.stringify({ userId, admin }),
    });
    setItems((cur) => cur.map((g) => (g.id === group.id ? next : g)));
  }

  if (allowGroups === null) return null;
  if (!allowGroups && !isHost) return null;

  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <p className="type-heading flex items-center gap-2 text-ink">
        <UsersIcon size={16} />
        {messages.world.groupsTitle}
      </p>
      {!allowGroups && isHost ? (
        <div className="mt-3 space-y-2">
          <p className="type-caption leading-5 text-muted">{messages.world.allowGroupsHint}</p>
          <button
            type="button"
            disabled={busy}
            onClick={() => void enable()}
            className="tap-scale type-button w-full rounded-pill bg-accent py-2.5 text-on-primary disabled:opacity-45"
          >
            {messages.world.enableGroups}
          </button>
        </div>
      ) : null}
      {allowGroups ? (
        <div className="mt-3 space-y-3">
          {isHost ? (
            creating ? (
              <form onSubmit={(e) => void create(e)} className="space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={messages.world.groupNamePlaceholder}
                  className="type-body w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-ink"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCreating(false)}
                    className="tap-scale type-button flex-1 rounded-pill border border-border py-2 text-ink"
                  >
                    {messages.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={busy || !name.trim()}
                    className="tap-scale type-button flex-1 rounded-pill bg-accent py-2 text-on-primary disabled:opacity-45"
                  >
                    {messages.world.createGroup}
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="tap-scale type-button flex w-full items-center justify-center gap-2 rounded-pill border-2 border-dashed border-accent/40 bg-accent-soft py-2.5 text-accent"
              >
                <PlusIcon size={15} />
                {messages.world.createGroup}
              </button>
            )
          ) : null}
          {items.length === 0 ? (
            <p className="type-caption text-muted">{messages.world.groupsEmpty}</p>
          ) : (
            items.map((g) => (
              <article key={g.id} className="rounded-2xl bg-surface-sunken p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="type-heading text-ink">{g.name}</p>
                    <p className="type-caption text-muted">
                      {messages.world.membersCount.replace("{n}", String(g.memberCount))}
                    </p>
                  </div>
                  {g.canRespond ? (
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void act(g.id, "decline")}
                        className="tap-scale type-caption rounded-pill border border-border bg-surface px-2.5 py-1.5 font-semibold text-ink"
                      >
                        {messages.world.declineGroup}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void act(g.id, "accept")}
                        className="tap-scale type-caption rounded-pill bg-accent px-2.5 py-1.5 font-semibold text-on-primary"
                      >
                        {messages.world.acceptGroup}
                      </button>
                    </div>
                  ) : null}
                </div>
                {g.members.length ? (
                  <ul className="mt-2 space-y-1.5">
                    {g.members.map((m) => (
                      <li key={m.id} className="flex items-center gap-2">
                        <Avatar src={m.avatarUrl} firstName={m.firstName} lastName={m.lastName} size="xs" />
                        <span className="type-caption min-w-0 flex-1 truncate text-ink">
                          {m.firstName} {m.lastName}
                        </span>
                        <span className="type-caption text-muted">
                          {m.role === "HOST"
                            ? messages.world.groupHost
                            : m.role === "ADMIN"
                              ? messages.world.groupAdmin
                              : ""}
                        </span>
                        {g.canAdmin && m.role !== "HOST" ? (
                          <button
                            type="button"
                            onClick={() => void toggleAdmin(g, m.id, m.role !== "ADMIN")}
                            className="type-caption font-semibold text-accent"
                          >
                            {m.role === "ADMIN" ? messages.world.removeAdmin : messages.world.makeAdmin}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-2">
                  {g.viewerStatus === "JOINED" ? (
                    <button
                      type="button"
                      onClick={() => void openChat(g)}
                      className="tap-scale type-caption inline-flex items-center gap-1 rounded-pill bg-accent px-3 py-1.5 font-semibold text-on-primary"
                    >
                      <MessageIcon size={13} />
                      {messages.world.openGroupChat}
                    </button>
                  ) : null}
                  {g.canInvite ? (
                    <button
                      type="button"
                      onClick={() => void openInvite(g)}
                      className="tap-scale type-caption rounded-pill border border-accent bg-surface px-3 py-1.5 font-semibold text-accent"
                    >
                      {messages.world.inviteToGroup}
                    </button>
                  ) : null}
                  {g.canLeave ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void act(g.id, "leave")}
                      className="tap-scale type-caption rounded-pill px-3 py-1.5 font-semibold text-danger"
                    >
                      {messages.world.leaveGroup}
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}
      <Modal
        open={Boolean(inviteFor)}
        title={messages.world.inviteToGroup}
        onClose={() => setInviteFor(null)}
        hideActions
      >
        {candidates === null ? (
          <p className="type-caption text-muted">{messages.common.loading}</p>
        ) : candidates.length === 0 ? (
          <p className="type-caption text-muted">{messages.world.groupCandidatesEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {candidates.map((c) => (
              <li key={c.id} className="flex items-center gap-2">
                <Avatar src={c.avatarUrl} firstName={c.firstName} lastName={c.lastName} size="sm" />
                <span className="type-body-sm min-w-0 flex-1 truncate text-ink">
                  {c.firstName} {c.lastName}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void invite(c.id)}
                  className="tap-scale type-caption rounded-pill bg-accent px-3 py-1.5 font-semibold text-on-primary"
                >
                  {messages.world.inviteToGroup}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </section>
  );
}
