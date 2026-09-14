"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PrimaryButton, ScreenHeader, SecondaryButton, TextInput } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useMoney } from "@/lib/money";
import type { ExperiencePlanView } from "@/lib/intelligence";

export default function Page() {
  return (
    <AppShell chrome="nav">
      <PlanScreen />
    </AppShell>
  );
}

function PlanScreen() {
  const { messages } = useI18n();
  const { formatPrice } = useMoney();
  const router = useRouter();
  const [text, setText] = useState("");
  const [surprise, setSurprise] = useState(false);
  const [plan, setPlan] = useState<ExperiencePlanView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate(nextSurprise = surprise) {
    setBusy(true);
    setError(null);
    try {
      const created = await api<ExperiencePlanView>("/intelligence/plans", {
        method: "POST",
        body: JSON.stringify({ text: text || messages.intel.agentHint, surprise: nextSurprise }),
      });
      setPlan(created);
      setSurprise(nextSurprise);
    } catch (e) {
      setError(e instanceof ApiError && String(e.code).includes("RATE") ? messages.intel.rateLimit : messages.common.error);
    } finally {
      setBusy(false);
    }
  }

  async function tweak(kind: "cheaper" | "closer" | "calmer" | "social" | "spontaneous") {
    if (!plan) return;
    setPlan(await api<ExperiencePlanView>(`/intelligence/plans/${plan.id}/tweak`, { method: "POST", body: JSON.stringify({ tweak: kind }) }));
  }

  async function reveal(order: number) {
    if (!plan) return;
    setPlan(await api<ExperiencePlanView>(`/intelligence/plans/${plan.id}/reveal/${order}`, { method: "POST" }));
  }

  return (
    <div className="px-4 py-4">
      <ScreenHeader title={messages.intel.createTitle} onBack={() => router.back()} />
      <p className="type-caption mt-2 text-muted">{messages.intel.createHint}</p>
      <TextInput
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={messages.intel.createHint}
        className="mt-3"
      />
      <div className="mt-3 space-y-2">
        <PrimaryButton loading={busy} onClick={() => void generate(false)}>
          {messages.intel.createTitle}
        </PrimaryButton>
        <SecondaryButton loading={busy} onClick={() => void generate(true)}>
          {messages.intel.surpriseMe}
        </SecondaryButton>
      </div>
      {error ? <p className="type-caption mt-2 text-danger">{error}</p> : null}
      {plan ? (
        <div className="mt-5 space-y-3">
          <h2 className="type-heading text-ink">{plan.title}</h2>
          <p className="type-caption text-muted">{messages.intel.legalNote}</p>
          {plan.steps.map((step) => (
            <article key={step.order} className="rounded-card bg-surface p-4 shadow-card">
              <p className="type-caption text-muted">{new Date(step.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              <p className="type-heading text-ink">{step.title}</p>
              <p className="type-caption mt-1 text-muted">
                {formatPrice(step.costXaf)} · {messages.intel.travel.replace("{min}", String(step.travelMin))}
              </p>
              {step.hint ? <p className="type-caption mt-1 text-muted">{messages.intel.hintStep}</p> : null}
              {step.eventId ? (
                <Link href={`/events/${step.eventId}`} className="type-caption mt-2 inline-block font-semibold text-accent">
                  {messages.world.seeEventFromMood}
                </Link>
              ) : null}
              {!step.revealed ? (
                <button type="button" className="type-caption mt-2 font-semibold text-accent" onClick={() => void reveal(step.order)}>
                  {messages.intel.revealStep}
                </button>
              ) : null}
            </article>
          ))}
          <p className="type-body-sm font-semibold text-ink">
            {messages.intel.total} · {formatPrice(plan.totalCostXaf)}
          </p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["cheaper", messages.intel.cheaper],
                ["closer", messages.intel.closer],
                ["calmer", messages.intel.calmer],
                ["social", messages.intel.moreSocial],
                ["spontaneous", messages.intel.moreSpontaneous],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => void tweak(key)}
                className="tap-scale rounded-pill bg-surface-sunken px-3 py-1.5 type-caption font-semibold"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
