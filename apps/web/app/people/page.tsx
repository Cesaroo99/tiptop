"use client";

import { useEffect, useMemo, useState } from "react";
import { presenceFromDeclared, type PresenceState } from "@tiptop/domain";
import { AppShell } from "@/components/AppShell";
import { NearbyPersonCard } from "@/components/NearbyPersonCard";
import { PersonSwipeDeck } from "@/components/PersonSwipeDeck";
import { SearchEntry } from "@/components/SearchEntry";
import { Chip, EmptyState, ErrorBanner, Skeleton } from "@/components/ui";
import { api, type PersonCard } from "@/lib/api";
import { useViewerLocation } from "@/lib/viewer-location";
import { useI18n } from "@/lib/i18n";
import { useLikePlacement } from "@/lib/like-placement";
import { useSession } from "@/lib/session";

type Circle = "FRIEND" | "NEARBY" | "LATER";
type PresenceFilter = "ALL" | "AVAILABLE" | "UNSURE" | "UNAVAILABLE";

type PeopleFilters = {
  presence: PresenceFilter;
  maxKm: string;
  profession: string;
};

const EMPTY_FILTERS: PeopleFilters = { presence: "ALL", maxKm: "", profession: "" };

function filterCount(f: PeopleFilters) {
  return (f.presence !== "ALL" ? 1 : 0) + (f.maxKm.trim() ? 1 : 0) + (f.profession.trim() ? 1 : 0);
}

export default function Page() {
  return (
    <AppShell>
      <PeopleCarousel />
    </AppShell>
  );
}

function PeopleCarousel() {
  const { messages } = useI18n();
  const { user } = useSession();
  const { placement } = useLikePlacement();
  const { origin: coords } = useViewerLocation(user ?? undefined);
  const [items, setItems] = useState<PersonCard[] | null>(null);
  const [circle, setCircle] = useState<Circle>("NEARBY");
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [applied, setApplied] = useState<PeopleFilters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState<PeopleFilters>(EMPTY_FILTERS);

  async function load(next = applied) {
    try {
      const params = new URLSearchParams();
      params.set("city", user?.city ?? "Yaoundé");
      if (user?.zone) params.set("zone", user.zone);
      if (next.presence !== "ALL") params.set("presence", next.presence);
      if (next.maxKm.trim()) params.set("maxKm", next.maxKm.trim());
      if (next.profession.trim()) params.set("profession", next.profession.trim());
      if (coords) {
        params.set("lat", String(coords.latitude));
        params.set("lng", String(coords.longitude));
      }
      const data = await api<{ items: PersonCard[] }>(`/discovery/people?${params.toString()}`);
      setItems(data.items);
      setIndex(0);
    } catch {
      setError(messages.common.error);
    }
  }

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.city, user?.zone, applied.presence, applied.maxKm, applied.profession, coords?.latitude, coords?.longitude]);

  const filtered = useMemo(() => {
    if (!items) return null;
    return items.filter((p) => {
      if ((p.circle ?? "NEARBY") !== circle) return false;
      if (applied.presence === "ALL") return true;
      const presence = (p.presence ?? presenceFromDeclared(p.availability)) as PresenceState;
      return presence === applied.presence;
    });
  }, [items, circle, applied.presence]);

  function setCircleTab(next: Circle) {
    setCircle(next);
    setIndex(0);
  }

  function applyFilters(next: PeopleFilters) {
    setApplied(next);
    setDraft(next);
    setFiltersOpen(false);
    setIndex(0);
  }

  if (error) return <ErrorBanner message={error} onRetry={() => void load()} />;
  if (!items || !filtered) return <Skeleton className="mx-4 mt-6 h-96" />;

  const person = filtered[index];
  const activeFilters = filterCount(applied);
  const title =
    circle === "FRIEND"
      ? applied.presence === "AVAILABLE"
        ? messages.world.peopleFriendsAvailable
        : messages.world.peopleFriends
      : circle === "LATER"
        ? messages.world.peopleLater
        : applied.presence === "AVAILABLE"
          ? messages.world.peopleAvailableAround
          : messages.world.peopleNearby;
  const empty =
    activeFilters > 0
      ? messages.world.peopleEmptyBody
      : circle === "FRIEND"
        ? messages.world.peopleFriendsEmpty
        : circle === "LATER"
          ? messages.world.peopleLaterEmpty
          : messages.world.peopleAroundEmpty;

  const counts = {
    FRIEND: items.filter((p) => p.circle === "FRIEND").length,
    NEARBY: items.filter((p) => (p.circle ?? "NEARBY") === "NEARBY").length,
    LATER: items.filter((p) => p.circle === "LATER").length,
  };

  const chrome = (
    <PeopleChrome
      title={title}
      circle={circle}
      counts={counts}
      filtersOpen={filtersOpen}
      filterCount={activeFilters}
      onToggleFilters={() => {
        setFiltersOpen((v) => {
          if (!v) setDraft(applied);
          return !v;
        });
      }}
      onCircle={setCircleTab}
    />
  );

  const filterForm = filtersOpen ? (
    <form
      className="mb-3 space-y-2.5 rounded-card bg-surface p-3 text-center shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        applyFilters(draft);
      }}
    >
      <p className="type-caption font-semibold text-muted">{messages.world.presenceFilter}</p>
      <div className="flex flex-wrap justify-center gap-1.5">
        {(
          [
            ["ALL", messages.world.presenceAll],
            ["AVAILABLE", messages.world.available],
            ["UNSURE", messages.world.unsure],
            ["UNAVAILABLE", messages.world.unavailable],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setDraft((cur) => ({ ...cur, presence: key }))}
            className={`type-caption rounded-full px-2.5 py-1.5 font-semibold ${
              draft.presence === key ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <input
        value={draft.maxKm}
        onChange={(e) => setDraft((cur) => ({ ...cur, maxKm: e.target.value }))}
        placeholder={messages.world.maxDistance}
        inputMode="numeric"
        className="h-10 w-full rounded-full bg-surface-sunken px-4 text-center type-body-sm text-ink outline-none"
      />
      <input
        value={draft.profession}
        onChange={(e) => setDraft((cur) => ({ ...cur, profession: e.target.value }))}
        placeholder={messages.world.professionFilter}
        className="h-10 w-full rounded-full bg-surface-sunken px-4 text-center type-body-sm text-ink outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => applyFilters(EMPTY_FILTERS)}
          className="type-button tap-scale h-9 rounded-full bg-surface-sunken text-ink"
        >
          {messages.world.clearFilters}
        </button>
        <button type="submit" className="type-button tap-scale h-9 rounded-full bg-accent text-on-primary">
          {messages.world.applyFilters}
        </button>
      </div>
    </form>
  ) : null;

  if (!person) {
    return (
      <div className="px-4 py-3">
        {chrome}
        {filterForm}
        <EmptyState title={title} body={empty} />
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-0 flex-col overflow-hidden px-4 pt-3 ${
        placement ? "-mb-36 h-[calc(100%+9rem)] pb-[6.25rem]" : "-mb-24 h-[calc(100%+6rem)] pb-[4.75rem]"
      }`}
    >
      {chrome}
      {filterForm}
      <div className="min-h-0 flex-1">
        <PersonSwipeDeck
          items={filtered}
          index={Math.min(index, filtered.length - 1)}
          onIndexChange={setIndex}
          peekSrc={(p) => p.avatarUrl}
          fill
        >
          {(current) => (
            <NearbyPersonCard
              layout="fill"
              person={current}
              onChanged={(next) => {
                setItems((cur) => {
                  if (!cur) return cur;
                  return cur.map((p) => (p.id === next.id ? next : p));
                });
                if (circle === "LATER" && next.circle !== "LATER") setIndex(0);
              }}
            />
          )}
        </PersonSwipeDeck>
      </div>
    </div>
  );
}

function PeopleChrome({
  title,
  circle,
  counts,
  filtersOpen,
  filterCount: active,
  onToggleFilters,
  onCircle,
}: {
  title: string;
  circle: Circle;
  counts: Record<Circle, number>;
  filtersOpen: boolean;
  filterCount: number;
  onToggleFilters: () => void;
  onCircle: (c: Circle) => void;
}) {
  const { messages } = useI18n();
  const tabs: Array<[Circle, string]> = [
    ["FRIEND", messages.world.peopleFriends],
    ["NEARBY", messages.world.peopleAround],
    ["LATER", messages.world.peopleLater],
  ];
  return (
    <>
      <div className="mb-2 flex items-end justify-between gap-3">
        <h1 className="type-h1 min-w-0 flex-1 truncate text-accent">{title}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <SearchEntry
            href="/search?type=people"
            size={16}
            className="tap-scale grid h-9 w-9 place-items-center rounded-full bg-surface-sunken text-muted transition hover:brightness-95"
          />
          <Chip active={filtersOpen || active > 0} onClick={onToggleFilters} tone={active > 0 ? "info" : "neutral"}>
            {active > 0 ? messages.world.filtersActive.replace("{n}", String(active)) : messages.world.filters}
          </Chip>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-3 gap-1 rounded-full bg-surface-sunken p-1">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onCircle(key)}
            className={`type-caption h-8 truncate rounded-full font-semibold ${
              circle === key ? "bg-surface text-ink shadow-xs" : "text-muted"
            }`}
          >
            {label}
            {counts[key] ? ` ${counts[key]}` : ""}
          </button>
        ))}
      </div>
    </>
  );
}
