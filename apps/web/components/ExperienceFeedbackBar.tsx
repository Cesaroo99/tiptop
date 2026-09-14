"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export function ExperienceFeedbackBar({ eventId }: { eventId: string }) {
  const { messages } = useI18n();
  const [sent, setSent] = useState(false);

  async function send(mood: "LOVED" | "GOOD" | "OK" | "DISLIKED") {
    await api("/intelligence/experience-feedback", {
      method: "POST",
      body: JSON.stringify({ eventId, mood }),
    });
    setSent(true);
  }

  if (sent) return <p className="type-caption text-muted">{messages.intel.howWasIt}</p>;

  return (
    <section className="rounded-card bg-surface p-4 shadow-card">
      <p className="type-body-sm font-semibold text-ink">{messages.intel.howWasIt}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(
          [
            ["LOVED", messages.intel.loved],
            ["GOOD", messages.intel.good],
            ["OK", messages.intel.ok],
            ["DISLIKED", messages.intel.disliked],
          ] as const
        ).map(([mood, label]) => (
          <button
            key={mood}
            type="button"
            onClick={() => void send(mood)}
            className="tap-scale rounded-pill bg-surface-sunken px-3 py-1.5 type-caption font-semibold text-ink"
          >
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
