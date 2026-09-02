"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PrimaryButton, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function ComposePage() {
  return (
    <AppShell>
      <Suspense>
        <Composer />
      </Suspense>
    </AppShell>
  );
}

function Composer() {
  const { messages } = useI18n();
  const { user } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("type");
  const [kind, setKind] = useState<"post" | "event" | "mood">(
    initial === "event" || initial === "mood" ? initial : "post",
  );
  const [body, setBody] = useState("");
  const [withLoc, setWithLoc] = useState(true);
  const [city, setCity] = useState(user?.city ?? "Yaoundé");
  const [zone, setZone] = useState(user?.zone ?? "Carrefour Damas");
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [priceXaf, setPriceXaf] = useState("0");
  const [capacity, setCapacity] = useState("");
  const [minAge, setMinAge] = useState("");
  const [requiresReservation, setRequiresReservation] = useState(false);
  const [hours, setHours] = useState("12");
  const [visibility, setVisibility] = useState("ZONE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function publish() {
    setLoading(true);
    setError(null);
    try {
      if (kind === "post") {
        await api("/posts", {
          method: "POST",
          body: JSON.stringify({
            body,
            city: withLoc ? city : undefined,
            zone: withLoc ? zone : undefined,
            imageUrl: imageUrl || undefined,
          }),
        });
        router.replace("/");
      } else if (kind === "event") {
        await api("/events", {
          method: "POST",
          body: JSON.stringify({
            title,
            description: body,
            city,
            zone,
            venue: venue || undefined,
            startsAt: new Date(startsAt).toISOString(),
            priceXaf: Number(priceXaf) || 0,
            capacity: capacity ? Number(capacity) : undefined,
            minAge: minAge ? Number(minAge) : undefined,
            requiresReservation,
            imageUrl: imageUrl || undefined,
          }),
        });
        router.replace("/events");
      } else {
        await api("/moods", {
          method: "POST",
          body: JSON.stringify({
            body,
            imageUrl: imageUrl || undefined,
            hours: Number(hours) || 12,
            visibility,
          }),
        });
        router.replace("/mood");
      }
    } catch {
      setError(messages.common.error);
    } finally {
      setLoading(false);
    }
  }

  const canPublish =
    kind === "post" ? Boolean(body.trim()) : kind === "event" ? Boolean(title.trim() && startsAt) : Boolean(body.trim() || imageUrl);

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => router.back()} className="text-xl text-muted" aria-label={messages.common.close}>
          ×
        </button>
        <p className="font-semibold">
          {kind === "event" ? messages.world.createEvent : kind === "mood" ? messages.world.moodCreate : messages.social.publication}
        </p>
        <button
          type="button"
          disabled={loading || !canPublish}
          onClick={() => void publish()}
          className="rounded-pill bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {messages.social.publish}
        </button>
      </div>
      <div className="mb-4 flex gap-2 text-sm">
        {(["post", "event", "mood"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-pill px-3 py-1.5 ${kind === k ? "bg-accent text-white" : "bg-[var(--border)]"}`}
          >
            {k === "post" ? messages.world.typePost : k === "event" ? messages.world.typeEvent : messages.world.typeMood}
          </button>
        ))}
      </div>
      {kind === "event" ? (
        <div className="space-y-3">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={messages.world.eventTitle} />
          <TextInput value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="datetime-local" />
          <TextInput value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={messages.world.eventVenue} />
          <TextInput value={priceXaf} onChange={(e) => setPriceXaf(e.target.value)} type="number" min={0} placeholder={messages.world.eventPrice} />
          <p className="text-xs text-muted">{messages.world.eventPriceHint}</p>
          <TextInput value={capacity} onChange={(e) => setCapacity(e.target.value)} type="number" min={1} placeholder={messages.world.eventCapacity} />
          <TextInput value={minAge} onChange={(e) => setMinAge(e.target.value)} type="number" min={1} placeholder={messages.world.eventMinAge} />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={requiresReservation} onChange={(e) => setRequiresReservation(e.target.checked)} />
            {messages.world.eventReserve}
          </label>
        </div>
      ) : null}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={kind === "event" ? messages.world.eventDescription : messages.social.saySomething}
        className="mt-3 min-h-32 w-full rounded-2xl border border-[var(--border)] bg-surface p-4 text-ink"
      />
      {kind === "mood" ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TextInput value={hours} onChange={(e) => setHours(e.target.value)} type="number" min={1} max={24} placeholder={messages.world.moodHours} />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-ink"
          >
            <option value="ZONE">{messages.world.visZone}</option>
            <option value="FOLLOWERS">{messages.world.visFollowers}</option>
          </select>
        </div>
      ) : null}
      {kind !== "mood" || withLoc ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" />
          <TextInput value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone" />
        </div>
      ) : null}
      <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-3">
        <button type="button" className="flex w-full items-center gap-2 py-2 text-left text-ink" onClick={() => setImageUrl((v) => (v ? "" : "/seed/black-white.svg"))}>
          <span>📷</span> {messages.social.addImage}
          <span className="ml-auto text-xs text-muted">{imageUrl ? "✓" : messages.social.noImageHint}</span>
        </button>
        {kind === "post" ? (
          <button type="button" className="flex w-full items-center gap-2 py-2 text-left text-ink" onClick={() => setWithLoc((v) => !v)}>
            <span>📍</span> {messages.social.addLocation}
          </button>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-6 md:hidden">
        <PrimaryButton disabled={!canPublish} loading={loading} onClick={() => void publish()}>
          {messages.social.publish}
        </PrimaryButton>
      </div>
    </div>
  );
}
