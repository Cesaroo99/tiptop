"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, ScreenHeader, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { formatEventWhen } from "@/lib/time";
import { useRouter } from "next/navigation";

type SearchResult = {
  people: Array<{
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    certified: boolean;
    profession: string | null;
    city: string | null;
  }>;
  posts: Array<{
    id: string;
    body: string;
    createdAt: string;
    author: { username: string; firstName: string; lastName: string };
  }>;
  events: Array<{
    id: string;
    title: string;
    startsAt: string;
    city: string;
    zone: string | null;
    priceXaf: number;
  }>;
  wishes: Array<{
    id: string;
    title: string;
    category: string;
    owner: { username: string; firstName: string; lastName: string };
  }>;
  moods: Array<{
    id: string;
    body: string;
    activity: string | null;
    city: string | null;
    author: { username: string; firstName: string; lastName: string };
  }>;
};

const filters = ["all", "people", "posts", "events", "wishes", "moods"] as const;

export default function SearchPage() {
  const { locale, messages } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState<(typeof filters)[number]>("all");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      setResult(await api<SearchResult>(`/search?q=${encodeURIComponent(q)}&type=${type}`));
    } finally {
      setLoading(false);
    }
  }

  const labels: Record<(typeof filters)[number], string> = {
    all: messages.social.all,
    people: messages.social.people,
    posts: messages.social.publications,
    events: messages.social.events,
    wishes: messages.social.wishesLabel,
    moods: messages.social.moodsLabel,
  };

  const empty =
    result &&
    result.people.length === 0 &&
    result.posts.length === 0 &&
    result.events.length === 0 &&
    result.wishes.length === 0 &&
    result.moods.length === 0;

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.common.search} onBack={() => router.back()} />
      <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder={messages.common.search} />
      <div className="mt-3 flex gap-3 overflow-x-auto text-sm">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setType(f)}
            className={`pb-1 ${type === f ? "border-b-2 border-accent font-semibold text-accent" : "text-muted"}`}
          >
            {labels[f]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => void run()}
        className="mt-4 w-full rounded-pill bg-accent py-3 font-semibold text-white"
      >
        {messages.social.applySearch}
      </button>
      {loading ? <p className="mt-4 text-sm text-muted">{messages.common.loading}</p> : null}
      {empty ? <EmptyState title={messages.common.search} body={messages.social.emptySearch} /> : null}
      <div className="mt-4 space-y-3">
        {result?.people.map((p) => (
          <Link key={p.id} href={`/u/${p.username}`} className="block rounded-card bg-surface p-4 shadow-card">
            <p className="font-semibold text-accent">
              {p.firstName} {p.lastName} {p.certified ? "✓" : ""}
            </p>
            <p className="text-sm text-muted">{p.profession || `@${p.username}`}</p>
          </Link>
        ))}
        {result?.events.map((e) => (
          <Link key={e.id} href={`/events/${e.id}`} className="block rounded-card bg-surface p-4 shadow-card">
            <p className="text-sm font-semibold text-accent">{e.title}</p>
            <p className="text-xs text-muted">
              {formatEventWhen(e.startsAt, locale)} · {e.city}
              {e.priceXaf > 0 ? ` · ${e.priceXaf} FCFA` : ""}
            </p>
          </Link>
        ))}
        {result?.posts.map((p) => (
          <Link key={p.id} href={`/posts/${p.id}`} className="block rounded-card bg-surface p-4 shadow-card">
            <p className="text-sm font-semibold text-accent">
              {p.author.firstName} {p.author.lastName}
            </p>
            <p className="text-sm text-ink">{p.body}</p>
          </Link>
        ))}
        {result?.wishes.map((w) => (
          <Link key={w.id} href={`/u/${w.owner.username}`} className="block rounded-card bg-surface p-4 shadow-card">
            <p className="text-sm font-semibold text-accent">{w.title}</p>
            <p className="text-xs text-muted">
              {w.owner.firstName} {w.owner.lastName}
            </p>
          </Link>
        ))}
        {result?.moods.map((m) => (
          <Link key={m.id} href={`/mood/${m.id}`} className="block rounded-card bg-surface p-4 shadow-card">
            <p className="text-sm font-semibold text-accent">{m.activity || m.body}</p>
            <p className="text-xs text-muted">
              {m.author.firstName} {m.author.lastName} {m.city ? `· ${m.city}` : ""}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
