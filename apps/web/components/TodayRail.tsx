"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/lib/money";
import { reasonLabel, type TodayRec } from "@/lib/intelligence";

export function TodayRail() {
  const { messages } = useI18n();
  const { formatPrice } = useMoney();
  const [items, setItems] = useState<TodayRec[] | null>(null);
  const [intro, setIntro] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [why, setWhy] = useState<string | null>(null);

  useEffect(() => {
    api<{ enabled: boolean; items: TodayRec[]; intro: string | null }>("/intelligence/today")
      .then((data) => {
        setEnabled(data.enabled);
        setItems(data.items ?? []);
        setIntro(data.intro);
      })
      .catch(() => setItems([]));
  }, []);

  if (items === null || !enabled) return null;
  if (items.length === 0) return null;

  async function react(id: string, kind: "LIKE" | "NOT_INTERESTED" | "HIDE_TYPE" | "WHY") {
    const res = await api<{ why?: string[] }>("/intelligence/feedback", {
      method: "POST",
      body: JSON.stringify({ recommendationId: id, kind }),
    });
    if (kind === "WHY") {
      setWhy((res.why ?? []).map((key) => reasonLabel(key, messages.intel)).join(" "));
      return;
    }
    setItems((cur) => (cur ?? []).filter((row) => row.id !== id));
  }

  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <h2 className="type-heading text-ink">{messages.intel.todayTitle}</h2>
        <Link href="/plan" className="type-caption font-semibold text-accent">
          {messages.intel.createTitle}
        </Link>
      </div>
      <p className="type-caption mt-1 text-muted">{intro || messages.intel.todayIntro}</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-2xl bg-surface-sunken px-3 py-2.5">
            <Link href={`/events/${item.eventId}`} className="block">
              <p className="type-body-sm font-semibold text-ink">{item.title}</p>
              <p className="type-caption mt-0.5 text-muted">
                {new Date(item.startsAt).toLocaleString()} · {item.city}
                {item.zone ? ` · ${item.zone}` : ""} · {formatPrice(item.priceXaf, item.currency)}
              </p>
            </Link>
            <p className="type-caption mt-1 text-accent">{reasonLabel(item.reasonKey, messages.intel)}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="type-caption font-semibold text-accent" onClick={() => void react(item.id, "LIKE")}>
                {messages.intel.likeRec}
              </button>
              <button type="button" className="type-caption text-muted" onClick={() => void react(item.id, "NOT_INTERESTED")}>
                {messages.intel.skipRec}
              </button>
              <button type="button" className="type-caption text-muted" onClick={() => void react(item.id, "HIDE_TYPE")}>
                {messages.intel.hideType}
              </button>
              <button type="button" className="type-caption text-muted" onClick={() => void react(item.id, "WHY")}>
                {messages.intel.seeWhy}
              </button>
            </div>
          </article>
        ))}
      </div>
      {why ? <p className="type-caption mt-2 text-muted">{why}</p> : null}
    </section>
  );
}
