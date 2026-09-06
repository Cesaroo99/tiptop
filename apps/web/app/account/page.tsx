"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/Avatar";
import { PresencePicker } from "@/components/PresencePicker";
import { Field, PrimaryButton, ScreenHeader, TextArea, TextInput } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import { presenceFromDeclared } from "@tiptop/domain";
import { InterestChips } from "@/components/InterestChips";

const AVATARS = [
  "cesar",
  "erica",
  "mbelle",
  "onguene",
  "amina",
  "fouda",
  "nadege",
  "koffi",
  "sarah",
  "alex",
  "rachel",
  "william",
  "mireille",
] as const;

const COVERS = ["night", "crowd", "rooftop", "city"] as const;

const COUNTRIES = [
  { code: "CM", fr: "Cameroun", en: "Cameroon" },
  { code: "CA", fr: "Canada", en: "Canada" },
  { code: "FR", fr: "France", en: "France" },
  { code: "BE", fr: "Belgique", en: "Belgium" },
  { code: "CH", fr: "Suisse", en: "Switzerland" },
  { code: "US", fr: "États-Unis", en: "United States" },
  { code: "GB", fr: "Royaume-Uni", en: "United Kingdom" },
  { code: "SN", fr: "Sénégal", en: "Senegal" },
  { code: "CI", fr: "Côte d’Ivoire", en: "Côte d’Ivoire" },
] as const;

type BlockedPerson = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

export default function AccountPage() {
  const { locale, messages } = useI18n();
  const { user, refresh } = useSession();
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [profession, setProfession] = useState(user?.profession ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? "");
  const [country, setCountry] = useState(user?.country ?? "CM");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(user?.coverUrl ?? "");
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [blocked, setBlocked] = useState<BlockedPerson[]>([]);
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || hydratedId === user.id) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setProfession(user.profession ?? "");
    setUsername(user.username ?? "");
    setBio(user.bio ?? "");
    setWebsite(user.website ?? "");
    setBirthDate(user.birthDate ?? "");
    setCountry(user.country ?? "CM");
    setAvatarUrl(user.avatarUrl ?? "");
    setCoverUrl(user.coverUrl ?? "");
    setInterests(user.interests ?? []);
    setHydratedId(user.id);
  }, [user, hydratedId]);

  useEffect(() => {
    api<{ items: BlockedPerson[] }>("/users/me/blocks")
      .then((d) => setBlocked(d.items))
      .catch(() => setBlocked([]));
  }, []);

  if (!user) return null;

  async function setMyPresence(availability: "AVAILABLE" | "BUSY" | "HIDDEN") {
    setStatusBusy(true);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ availability, ttlHours: 4 }),
      });
      await refresh();
    } finally {
      setStatusBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSaved(false);
    try {
      await api("/users/me", {
        method: "PATCH",
        body: JSON.stringify({
          firstName,
          lastName,
          profession,
          username,
          bio,
          website,
          birthDate,
          country,
          avatarUrl,
          coverUrl,
          interests,
        }),
      });
      await refresh();
      setSaved(true);
    } finally {
      setLoading(false);
    }
  }

  async function unblock(id: string) {
    await api(`/users/${id}/block`, { method: "DELETE" });
    setBlocked((cur) => cur.filter((p) => p.id !== id));
  }

  const zoneLabel = [user.city, user.zone].filter(Boolean).join(" · ") || messages.home.locationFallback;

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.account.title} onBack={() => router.back()} />
      <form onSubmit={save} className="mt-4 space-y-4 rounded-card bg-surface p-5 shadow-card">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent/20 via-yellow/10 to-transparent">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-28 w-full object-cover" />
          ) : (
            <div className="h-28" />
          )}
          <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--bg)] p-1">
            <Avatar src={avatarUrl || null} firstName={firstName} lastName={lastName} size={72} />
          </span>
        </div>

        <div>
          <p className="type-label mb-1.5 text-subtle">{messages.account.avatar}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {AVATARS.map((id) => {
              const src = `/seed/avatars/${id}.jpg`;
              const active = avatarUrl === src;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={`${messages.account.avatar} ${id}`}
                  onClick={() => setAvatarUrl(src)}
                  className={`tap-scale overflow-hidden rounded-full ${active ? "ring-2 ring-accent ring-offset-2 ring-offset-surface" : ""}`}
                >
                  <Avatar src={src} firstName={id} lastName="" size={40} />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="type-label mb-1.5 text-subtle">{messages.account.cover}</p>
          <div className="grid grid-cols-4 gap-2">
            {COVERS.map((id) => {
              const src = `/seed/covers/${id}.jpg`;
              const active = coverUrl === src;
              return (
                <button
                  key={id}
                  type="button"
                  aria-label={`${messages.account.cover} ${id}`}
                  onClick={() => setCoverUrl(src)}
                  className={`tap-scale overflow-hidden rounded-xl ${active ? "ring-2 ring-accent" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-12 w-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>

        <Field label={messages.account.firstName}>
          <TextInput value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={messages.account.firstName} />
        </Field>
        <Field label={messages.account.lastName}>
          <TextInput value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={messages.account.lastName} />
        </Field>
        <Field label={messages.account.username}>
          <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder={messages.account.username} />
        </Field>
        <Field label={messages.account.profession}>
          <TextInput value={profession} onChange={(e) => setProfession(e.target.value)} placeholder={messages.account.profession} />
        </Field>
        <Field label={messages.account.bio} helper={messages.account.bioHint}>
          <TextArea value={bio} maxLength={280} onChange={(e) => setBio(e.target.value)} placeholder={messages.account.bio} />
        </Field>
        <Field label={messages.account.website} helper={messages.account.websiteHint}>
          <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="tiptop.cm" />
        </Field>
        <Field label={messages.account.interests} helper={messages.account.interestsHint}>
          <InterestChips value={interests} multiple onChange={(next) => setInterests(Array.isArray(next) ? next : [next])} />
        </Field>
        <Field label={messages.account.birthDate}>
          <TextInput type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </Field>
        <Field label={messages.account.country}>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="type-body w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-ink"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {locale === "en" ? c.en : c.fr}
              </option>
            ))}
          </select>
        </Field>
        <Field label={messages.account.phone} helper={messages.account.phoneLocked}>
          <TextInput value={user.phoneE164} disabled />
        </Field>
        <div>
          <p className="type-label mb-1.5 text-subtle">{messages.account.location}</p>
          <Link
            href="/zone"
            className="tap-scale type-body flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3.5 text-ink"
          >
            <span>{zoneLabel}</span>
            <span className="type-caption font-semibold text-accent">{messages.account.changeZone}</span>
          </Link>
        </div>
        <div className="space-y-2 text-center">
          <p className="type-caption font-semibold text-muted">{messages.account.status}</p>
          <PresencePicker
            value={presenceFromDeclared(user.availability)}
            busy={statusBusy}
            onChange={(k) => void setMyPresence(k)}
          />
          <p className="type-caption leading-5 text-muted">{messages.account.statusHint}</p>
        </div>
        {saved ? <p className="text-sm text-success">{messages.account.saved}</p> : null}
        <PrimaryButton type="submit" loading={loading}>
          {messages.account.save}
        </PrimaryButton>
        <Link href={`/u/${user.username}`} className="type-caption block text-center font-semibold text-accent">
          {messages.account.viewPublic}
        </Link>
      </form>

      <section className="mt-6 space-y-3">
        <p className="type-label px-1 text-subtle">{messages.account.blocked}</p>
        {blocked.length === 0 ? (
          <p className="type-caption rounded-card bg-surface px-4 py-3 text-muted shadow-xs">{messages.account.blockedEmpty}</p>
        ) : (
          blocked.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-card bg-surface px-4 py-3 shadow-xs">
              <Avatar src={p.avatarUrl} firstName={p.firstName} lastName={p.lastName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="type-heading truncate text-ink">
                  {p.firstName} {p.lastName}
                </p>
                <p className="type-caption text-muted">@{p.username}</p>
              </div>
              <button
                type="button"
                onClick={() => void unblock(p.id)}
                className="tap-scale type-caption font-semibold text-accent"
              >
                {messages.account.unblock}
              </button>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
