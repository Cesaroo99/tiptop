"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AgeCategoryPicker } from "@/components/AgeCategoryPicker";
import { AppShell } from "@/components/AppShell";
import { ErrorBanner, Field, PrimaryButton, ScreenHeader, TextInput } from "@/components/ui";
import { api, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <EditEventView />
    </AppShell>
  );
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditEventView() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const [event, setEvent] = useState<EventCardType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");
  const [zone, setZone] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("");
  const [minAge, setMinAge] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<EventCardType>(`/events/${id}`)
      .then((e) => {
        setEvent(e);
        setTitle(e.title);
        setDescription(e.description);
        setVenue(e.venue ?? "");
        setCity(e.city);
        setZone(e.zone ?? "");
        setStartsAt(toLocalInputValue(e.startsAt));
        setCapacity(e.capacity ? String(e.capacity) : "");
        setMinAge(e.minAge ?? 0);
      })
      .catch(() => setError(messages.common.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          venue,
          city,
          zone,
          startsAt: new Date(startsAt).toISOString(),
          capacity: capacity ? Number(capacity) : undefined,
          minAge,
        }),
      });
      setSaved(true);
    } catch {
      setError(messages.common.error);
    } finally {
      setSaving(false);
    }
  }

  if (error && !event) return <ErrorBanner message={error} />;
  if (!event) return <p className="type-body-sm p-4 text-muted">{messages.common.loading}</p>;

  return (
    <div className="px-4 py-4">
      <ScreenHeader title={messages.world.manageEdit} onBack={() => router.push(`/events/${id}/manage`)} />
      <div className="space-y-4">
        <Field label={messages.world.eventTitle}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
        </Field>
        <Field label={messages.world.eventDescription}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="type-body min-h-28 w-full rounded-xl border border-border bg-surface p-3.5 text-ink transition placeholder:text-subtle focus:border-accent"
          />
        </Field>
        <Field label={messages.world.eventWhen}>
          <TextInput type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </Field>
        <Field label={messages.world.eventVenue}>
          <TextInput value={venue} onChange={(e) => setVenue(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ville">
            <TextInput value={city} onChange={(e) => setCity(e.target.value)} />
          </Field>
          <Field label="Zone">
            <TextInput value={zone} onChange={(e) => setZone(e.target.value)} />
          </Field>
        </div>
        <Field label={messages.world.eventCapacity}>
          <TextInput type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </Field>
        <Field label={messages.world.eventMinAge}>
          <AgeCategoryPicker minAge={minAge} onChange={setMinAge} />
        </Field>
        {error ? <p className="type-body-sm text-danger">{error}</p> : null}
        {saved ? <p className="type-body-sm font-semibold text-success">{messages.account.saved}</p> : null}
        <PrimaryButton loading={saving} onClick={() => void save()}>
          {messages.account.save}
        </PrimaryButton>
      </div>
    </div>
  );
}
