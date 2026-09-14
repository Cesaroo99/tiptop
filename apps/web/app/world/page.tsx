"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ScreenHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

type World = {
  score: number;
  cities: Array<{ city: string; percent: number; attendedCount: number }>;
  collections: Array<{ category: string; discovered: boolean }>;
  missions: Array<{ kind: string; completedAt: string | null }>;
  achievements: Array<{ achievementId: string }>;
};

export default function Page() {
  return (
    <AppShell chrome="nav">
      <WorldScreen />
    </AppShell>
  );
}

function WorldScreen() {
  const { messages } = useI18n();
  const router = useRouter();
  const [data, setData] = useState<World | null>(null);

  useEffect(() => {
    api<World>("/intelligence/world")
      .then(setData)
      .catch(() => setData({ score: 0, cities: [], collections: [], missions: [], achievements: [] }));
  }, []);

  const badgeLabel: Record<string, string> = {
    FIRST_TIME: messages.intel.firstTime,
    LOCAL_EXPLORER: messages.intel.localExplorer,
    SOCIAL_FIRST: messages.intel.socialFirst,
  };

  return (
    <div className="px-4 py-4">
      <ScreenHeader title={messages.intel.worldTitle} onBack={() => router.back()} />
      {!data || (data.cities.length === 0 && data.collections.every((c) => !c.discovered)) ? (
        <p className="type-body-sm mt-6 text-muted">{messages.intel.worldEmpty}</p>
      ) : null}
      <div className="mt-4 space-y-3">
        {data?.cities.map((city) => (
          <article key={city.city} className="rounded-card bg-surface p-4 shadow-card">
            <p className="type-heading text-ink">{city.city}</p>
            <p className="type-caption text-muted">{city.percent}% · {city.attendedCount}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full bg-accent" style={{ width: `${city.percent}%` }} />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {data?.collections.map((item) => (
          <article key={item.category} className="rounded-card bg-surface p-3 shadow-card">
            <p className="type-body-sm font-semibold capitalize text-ink">{item.category}</p>
            <p className="type-caption text-muted">{item.discovered ? messages.intel.discovered : messages.intel.toDiscover}</p>
          </article>
        ))}
      </div>
      <h2 className="type-heading mt-6 text-ink">{messages.intel.missions}</h2>
      <ul className="mt-2 space-y-2">
        {data?.missions.map((m) => (
          <li key={m.kind} className="rounded-card bg-surface px-4 py-3 text-sm shadow-card">
            {m.kind}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        {data?.achievements.map((a) => (
          <span key={a.achievementId} className="rounded-pill bg-accent-soft px-3 py-1 type-caption font-semibold text-accent">
            {badgeLabel[a.achievementId] ?? a.achievementId}
          </span>
        ))}
      </div>
    </div>
  );
}
