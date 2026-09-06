"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { HeaderUtilityIcons } from "@/components/AppHeader";
import { ChevronDownIcon, PinIcon, SearchIcon } from "@/components/Icons";
import { SearchEventCard, SearchPersonCard } from "@/components/SearchCards";
import { CardSkeleton, EmptyState, ErrorBanner } from "@/components/ui";
import { api, type SearchResult } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/lib/money";
import { useSession } from "@/lib/session";

const FILTERS = ["all", "people", "posts", "events", "wishes", "moods", "offers"] as const;
type Filter = (typeof FILTERS)[number];

function parseType(raw: string | null): Filter {
  return FILTERS.includes(raw as Filter) ? (raw as Filter) : "all";
}

function SearchScreen() {
  const { messages } = useI18n();
  const { formatPrice } = useMoney();
  const { user } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(() => params.get("q") ?? "");
  const [type, setType] = useState<Filter>(() => parseType(params.get("type")));
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = [user?.city, user?.zone].filter(Boolean).join(" - ");

  const labels: Record<Filter, string> = useMemo(
    () => ({
      all: messages.social.all,
      people: messages.social.people,
      posts: messages.social.publications,
      events: messages.social.events,
      wishes: messages.social.wishesLabel,
      moods: messages.social.moodsLabel,
      offers: messages.need.title,
    }),
    [messages],
  );

  const run = useCallback(
    async (nextQ: string, nextType: Filter, syncUrl = true) => {
      setLoading(true);
      setError(null);
      const query = nextQ.trim();
      if (syncUrl) {
        const search = new URLSearchParams();
        if (query) search.set("q", query);
        if (nextType !== "all") search.set("type", nextType);
        const qs = search.toString();
        router.replace(qs ? `/search?${qs}` : "/search");
      }
      try {
        const city = user?.city ? `&city=${encodeURIComponent(user.city)}` : "";
        const zone = user?.zone ? `&zone=${encodeURIComponent(user.zone)}` : "";
        setResult(
          await api<SearchResult>(`/search?q=${encodeURIComponent(query)}&type=${nextType}${city}${zone}`),
        );
      } catch {
        setError(messages.common.error);
      } finally {
        setLoading(false);
      }
    },
    [messages.common.error, router, user?.city, user?.zone],
  );

  useEffect(() => {
    void run(params.get("q") ?? "", parseType(params.get("type")), false);
    // Premier chargement : suggestions locales ou query d’URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply(e?: React.FormEvent) {
    e?.preventDefault();
    void run(q, type);
  }

  function changeType(next: Filter) {
    setType(next);
    void run(q, next);
  }

  const empty =
    result &&
    result.people.length === 0 &&
    result.posts.length === 0 &&
    result.events.length === 0 &&
    result.wishes.length === 0 &&
    result.moods.length === 0 &&
    result.offers.length === 0;

  const showPeople = type === "all" || type === "people";
  const showEvents = type === "all" || type === "events";
  const showPosts = type === "all" || type === "posts";
  const showWishes = type === "all" || type === "wishes";
  const showMoods = type === "all" || type === "moods";
  const showOffers = type === "all" || type === "offers";

  return (
    <div className="px-4 pb-6 pt-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="type-h1 text-accent">{messages.common.search}</h1>
        <HeaderUtilityIcons />
      </div>

      <Link
        href="/zone"
        className="tap-scale type-body-sm flex h-12 items-center gap-2 rounded-full bg-surface-sunken px-4 text-left text-ink transition hover:brightness-95"
      >
        <PinIcon size={16} className="shrink-0 text-muted" />
        <span className="flex-1 truncate font-semibold">{location || messages.home.locationFallback}</span>
        <ChevronDownIcon size={14} className="shrink-0 text-muted" />
      </Link>

      <form onSubmit={apply} className="mt-3 space-y-3">
        <label className="flex h-12 items-center gap-2 rounded-full bg-surface-sunken px-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={messages.common.search}
            aria-label={messages.common.search}
            className="type-body min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-subtle"
          />
          <button type="submit" aria-label={messages.common.search} className="tap-scale grid h-9 w-9 place-items-center text-muted">
            <SearchIcon size={18} />
          </button>
        </label>

        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => changeType(f)}
              className={`type-body-sm shrink-0 pb-1.5 ${
                type === f ? "border-b-2 border-accent font-semibold text-ink" : "text-muted"
              }`}
            >
              {labels[f]}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="tap-scale type-button w-full rounded-pill bg-accent px-6 py-3.5 text-on-primary shadow-sm transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-45"
        >
          {messages.social.applySearch}
        </button>
      </form>

      {result?.suggested && !empty ? (
        <p className="type-caption mt-4 font-semibold text-muted">
          {location
            ? messages.social.searchAround.replace("{place}", location)
            : messages.social.searchSuggestions}
        </p>
      ) : null}

      {error ? (
        <div className="mt-4">
          <ErrorBanner message={error} onRetry={() => void run(q, type)} />
        </div>
      ) : null}

      {loading && !result ? (
        <div className="mt-4 space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : null}

      {empty && !loading ? <EmptyState title={messages.common.search} body={messages.social.emptySearch} /> : null}

      <div className="mt-4 space-y-4" data-testid="search-results">
        {showPeople && result && result.people.length > 0 ? (
          <section className="space-y-3">
            {type === "all" ? <p className="type-label text-subtle">{messages.social.people}</p> : null}
            {result.people.map((p) => (
              <SearchPersonCard key={p.id} person={p} />
            ))}
          </section>
        ) : null}

        {showEvents && result && result.events.length > 0 ? (
          <section className="space-y-3">
            {type === "all" ? <p className="type-label text-subtle">{messages.social.events}</p> : null}
            {result.events.map((e) => (
              <SearchEventCard
                key={e.id}
                event={e}
                onChanged={(next) =>
                  setResult((cur) =>
                    cur ? { ...cur, events: cur.events.map((item) => (item.id === next.id ? next : item)) } : cur,
                  )
                }
              />
            ))}
          </section>
        ) : null}

        {showPosts && result && result.posts.length > 0 ? (
          <section className="space-y-3">
            {type === "all" ? <p className="type-label text-subtle">{messages.social.publications}</p> : null}
            {result.posts.map((p) => (
              <Link key={p.id} href={`/posts/${p.id}`} className="block rounded-card bg-surface p-4 shadow-card">
                <p className="type-heading text-ink">
                  {p.author.firstName} {p.author.lastName}
                </p>
                <p className="type-body-sm mt-1 line-clamp-3 text-ink">{p.body}</p>
              </Link>
            ))}
          </section>
        ) : null}

        {showWishes && result && result.wishes.length > 0 ? (
          <section className="space-y-3">
            {type === "all" ? <p className="type-label text-subtle">{messages.social.wishesLabel}</p> : null}
            {result.wishes.map((w) => (
              <Link key={w.id} href={`/u/${w.owner.username}`} className="block rounded-card bg-surface p-4 shadow-card">
                <p className="type-heading text-ink">{w.title}</p>
                <p className="type-caption mt-1 text-muted">
                  {w.owner.firstName} {w.owner.lastName}
                </p>
              </Link>
            ))}
          </section>
        ) : null}

        {showMoods && result && result.moods.length > 0 ? (
          <section className="space-y-3">
            {type === "all" ? <p className="type-label text-subtle">{messages.social.moodsLabel}</p> : null}
            {result.moods.map((m) => (
              <Link key={m.id} href={`/mood?start=${m.id}`} className="block rounded-card bg-surface p-4 shadow-card">
                <p className="type-heading text-ink">{m.activity || m.body}</p>
                <p className="type-caption mt-1 text-muted">
                  {m.author.firstName} {m.author.lastName}
                  {m.city ? ` · ${m.city}` : ""}
                </p>
              </Link>
            ))}
          </section>
        ) : null}

        {showOffers && result && result.offers.length > 0 ? (
          <section className="space-y-3">
            {type === "all" ? <p className="type-label text-subtle">{messages.need.title}</p> : null}
            {result.offers.map((o) => (
              <Link key={o.id} href={`/need/${o.id}`} className="block rounded-card bg-surface p-4 shadow-card">
                <p className="type-heading text-ink">{o.title}</p>
                <p className="type-caption mt-1 text-muted">
                  {o.shopName || `${o.seller.firstName} ${o.seller.lastName}`} · {o.city}
                  {o.priceXaf > 0 ? ` · ${formatPrice(o.priceXaf, o.currency ?? "XAF")}` : ""}
                </p>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <AppShell chrome="nav">
      <SearchScreen />
    </AppShell>
  );
}
