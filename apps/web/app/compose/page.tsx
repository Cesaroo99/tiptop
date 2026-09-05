"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AgeCategoryPicker } from "@/components/AgeCategoryPicker";
import { CameraIcon, ImageIcon, PlayIcon } from "@/components/Icons";
import { MoodPlacePicker, type PickedPlace } from "@/components/MoodPlacePicker";
import { TextInput } from "@/components/ui";
import { resolveUserCurrency } from "@tiptop/domain";
import { api, type EventCard as EventCardType } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

const MAX_VIDEO_SECONDS = 90;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;

function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("VIDEO_READ_ERROR"));
    };
    video.src = URL.createObjectURL(file);
  });
}

function uploadVideo(file: File, onProgress: (pct: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/upload/video");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.url as string);
        } catch {
          reject(new Error("UPLOAD_PARSE_ERROR"));
        }
      } else {
        reject(new Error("UPLOAD_FAILED"));
      }
    };
    xhr.onerror = () => reject(new Error("UPLOAD_FAILED"));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

type ContactItem = { id: string; firstName: string; lastName: string; avatarUrl?: string | null };

const MOOD_VIDEOS = [
  { id: "concert", label: "Concert", src: "/seed/moods/video-concert.mp4" },
  { id: "piscine", label: "Piscine", src: "/seed/moods/video-piscine.mp4" },
  { id: "rooftop", label: "Rooftop", src: "/seed/moods/video-rooftop.mp4" },
  { id: "food", label: "Restaurant", src: "/seed/moods/video-food.mp4" },
];

export default function ComposePage() {
  return (
    <AppShell chrome="nav">
      <Suspense>
        <Composer />
      </Suspense>
    </AppShell>
  );
}

function Composer() {
  const { messages } = useI18n();
  const { user } = useSession();
  const viewerCurrency = resolveUserCurrency(user?.currency, user?.country);
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get("type");
  const [kind, setKind] = useState<"post" | "event" | "mood" | "offer">(
    initial === "event" || initial === "mood" || initial === "offer" ? initial : "post",
  );
  const [body, setBody] = useState("");
  const [withLoc, setWithLoc] = useState(true);
  const [city, setCity] = useState(user?.city ?? "Yaoundé");
  const [zone, setZone] = useState(user?.zone ?? "Carrefour Damas");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [videoError, setVideoError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [venue, setVenue] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [priceXaf, setPriceXaf] = useState("0");
  const [capacity, setCapacity] = useState("");
  const [minAge, setMinAge] = useState(0);
  const [requiresReservation, setRequiresReservation] = useState(false);
  const [paymentRule, setPaymentRule] = useState<"HOLD" | "PAY_FIRST">("HOLD");
  const [hours, setHours] = useState("12");
  const [visibility, setVisibility] = useState("ZONE");
  const [activity, setActivity] = useState("");
  const [eventId, setEventId] = useState("");
  const [myEvents, setMyEvents] = useState<EventCardType[]>([]);
  const [companionId, setCompanionId] = useState("");
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const [shopName, setShopName] = useState("");
  const [sellerKind, setSellerKind] = useState("PERSON");
  const [offerKind, setOfferKind] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "mood") return;
    api<{ items: EventCardType[] }>("/events?tab=mine")
      .then((d) => setMyEvents(d.items.filter((e) => e.status !== "CANCELLED")))
      .catch(() => setMyEvents([]));
    api<{ items: ContactItem[] }>("/contacts")
      .then((d) => setContacts(d.items))
      .catch(() => setContacts([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  useEffect(() => {
    // Libère l'URL locale de prévisualisation dès qu'elle n'est plus utilisée.
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  function clearVideoSelection() {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl("");
    setVideoUrl("");
    setVideoError(null);
  }

  async function onVideoFileSelected(file: File | undefined) {
    if (!file) return;
    setVideoError(null);
    if (!file.type.startsWith("video/")) {
      setVideoError(messages.world.videoTypeError);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoError(messages.world.videoTooLarge);
      return;
    }
    try {
      const duration = await readVideoDuration(file);
      if (duration > MAX_VIDEO_SECONDS) {
        setVideoError(messages.world.videoTooLong.replace("{seconds}", String(MAX_VIDEO_SECONDS)));
        return;
      }
    } catch {
      // Certains navigateurs ne fournissent pas toujours la durée exacte — on n'empêche pas
      // la publication pour autant, la limite de taille reste le garde-fou principal.
    }
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setImageUrl("");
    setVideoUrl("");
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
  }

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
            minAge: minAge > 0 ? minAge : undefined,
            requiresReservation,
            paymentRule: Number(priceXaf) > 0 ? paymentRule : undefined,
            imageUrl: imageUrl || undefined,
          }),
        });
        router.replace("/");
      } else if (kind === "offer") {
        await api("/offers", {
          method: "POST",
          body: JSON.stringify({
            title,
            description: body,
            kind: offerKind,
            sellerKind,
            shopName: shopName || undefined,
            priceXaf: Number(priceXaf) || 0,
            city: place?.city || city,
            zone: place?.zone || zone,
            placeName: place?.placeName || undefined,
            address: place?.address || undefined,
            latitude: place?.latitude ?? undefined,
            longitude: place?.longitude ?? undefined,
            imageUrl: imageUrl || undefined,
          }),
        });
        router.replace("/need");
      } else {
        let finalVideoUrl = videoUrl;
        if (videoFile) {
          setUploadProgress(0);
          try {
            finalVideoUrl = await uploadVideo(videoFile, setUploadProgress);
          } catch {
            setError(messages.world.videoUploadError);
            setUploadProgress(null);
            setLoading(false);
            return;
          }
          setUploadProgress(null);
        }
        await api("/moods", {
          method: "POST",
          body: JSON.stringify({
            body,
            imageUrl: finalVideoUrl ? undefined : imageUrl || undefined,
            videoUrl: finalVideoUrl || undefined,
            activity: activity || undefined,
            hours: Number(hours) || 12,
            visibility,
            city: place?.city || undefined,
            zone: place?.zone || undefined,
            placeName: place?.placeName || undefined,
            address: place?.address || undefined,
            latitude: place?.latitude ?? undefined,
            longitude: place?.longitude ?? undefined,
            eventId: eventId || undefined,
            companionId: companionId || undefined,
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
    kind === "post"
      ? Boolean(body.trim())
      : kind === "event"
        ? Boolean(title.trim() && startsAt)
        : kind === "offer"
          ? Boolean(title.trim())
          : Boolean(body.trim() || imageUrl || videoUrl || videoFile || activity.trim());

  return (
    <div className="px-4 py-4">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          className="tap-scale grid h-10 w-10 place-items-center rounded-full bg-surface-sunken text-ink"
          aria-label={messages.common.close}
        >
          ×
        </button>
        <p className="type-heading text-ink">
          {kind === "event"
            ? messages.world.createEvent
            : kind === "mood"
              ? messages.world.moodCreate
              : kind === "offer"
                ? messages.need.createTitle
                : messages.social.publication}
        </p>
        <button
          type="button"
          disabled={loading || !canPublish}
          onClick={() => void publish()}
          className="tap-scale type-button rounded-pill bg-accent px-4 py-2 text-on-primary shadow-sm disabled:opacity-40"
        >
          {messages.social.publish}
        </button>
      </div>
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {(["post", "event", "mood", "offer"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`type-caption tap-scale shrink-0 rounded-pill px-4 py-2 font-semibold transition ${
              kind === k ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
            }`}
          >
            {k === "post"
              ? messages.world.typePost
              : k === "event"
                ? messages.world.typeEvent
                : k === "mood"
                  ? messages.world.typeMood
                  : messages.world.typeOffer}
          </button>
        ))}
      </div>
      {kind === "event" ? (
        <div className="space-y-3">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={messages.world.eventTitle} />
          <TextInput value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="datetime-local" />
          <TextInput value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={messages.world.eventVenue} />
          <TextInput value={priceXaf} onChange={(e) => setPriceXaf(e.target.value)} type="number" min={0} placeholder={messages.world.eventPrice.replace("{currency}", viewerCurrency)} />
          <p className="text-xs text-muted">{messages.world.eventPriceHint}</p>
          <TextInput value={capacity} onChange={(e) => setCapacity(e.target.value)} type="number" min={1} placeholder={messages.world.eventCapacity} />
          <div>
            <p className="type-label mb-2 text-subtle">{messages.world.eventMinAge}</p>
            <AgeCategoryPicker minAge={minAge} onChange={setMinAge} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={requiresReservation} onChange={(e) => setRequiresReservation(e.target.checked)} />
            {messages.world.eventReserve}
          </label>
          {Number(priceXaf) > 0 ? (
            <div className="space-y-2">
              {(["HOLD", "PAY_FIRST"] as const).map((rule) => (
                <label key={rule} className="flex cursor-pointer items-start gap-2 rounded-xl bg-surface-sunken px-3 py-2.5">
                  <input
                    type="radio"
                    name="paymentRule"
                    checked={paymentRule === rule}
                    onChange={() => setPaymentRule(rule)}
                    className="mt-1"
                  />
                  <span>
                    <span className="type-body-sm block font-semibold text-ink">
                      {rule === "HOLD" ? messages.world.paymentHold : messages.world.paymentFirst}
                    </span>
                    <span className="type-caption text-muted">
                      {rule === "HOLD" ? messages.world.paymentHoldHint : messages.world.paymentFirstHint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {kind === "offer" ? (
        <div className="space-y-3">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={messages.need.titlePlaceholder} />
          <TextInput value={priceXaf} onChange={(e) => setPriceXaf(e.target.value)} type="number" min={0} placeholder={messages.need.pricePlaceholder.replace("{currency}", viewerCurrency)} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOfferKind("PRODUCT")}
              className={`type-caption tap-scale flex-1 rounded-pill px-3 py-2 font-semibold ${
                offerKind === "PRODUCT" ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
              }`}
            >
              {messages.need.product}
            </button>
            <button
              type="button"
              onClick={() => setOfferKind("SERVICE")}
              className={`type-caption tap-scale flex-1 rounded-pill px-3 py-2 font-semibold ${
                offerKind === "SERVICE" ? "bg-accent text-on-primary" : "bg-surface-sunken text-muted"
              }`}
            >
              {messages.need.service}
            </button>
          </div>
          <select
            value={sellerKind}
            onChange={(e) => setSellerKind(e.target.value)}
            className="type-body w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-ink"
          >
            <option value="PERSON">{messages.need.sellerPerson}</option>
            <option value="SHOP">{messages.need.sellerShop}</option>
            <option value="BUSINESS">{messages.need.sellerBusiness}</option>
          </select>
          {sellerKind !== "PERSON" ? (
            <TextInput value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder={messages.need.shopName} />
          ) : null}
        </div>
      ) : null}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={kind === "event" || kind === "offer" ? messages.world.eventDescription : messages.social.saySomething}
        className="type-body mt-3 min-h-32 w-full rounded-card border border-border bg-surface p-4 text-ink placeholder:text-subtle"
      />
      {kind === "mood" ? (
        <div className="mt-3 space-y-2">
          <TextInput
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder={messages.world.activityPlaceholder}
          />
        <div className="grid grid-cols-2 gap-2">
          <TextInput value={hours} onChange={(e) => setHours(e.target.value)} type="number" min={1} max={24} placeholder={messages.world.moodHours} />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            className="type-body rounded-xl border border-border bg-surface px-4 py-3.5 text-ink"
          >
            <option value="ZONE">{messages.world.visZone}</option>
            <option value="FOLLOWERS">{messages.world.visFollowers}</option>
          </select>
        </div>
        {myEvents.length > 0 ? (
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="type-body w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-ink"
          >
            <option value="">{messages.world.moodLinkEventNone}</option>
            {myEvents.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}
              </option>
            ))}
          </select>
        ) : null}
        {contacts.length > 0 ? (
          <select
            value={companionId}
            onChange={(e) => setCompanionId(e.target.value)}
            className="type-body w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-ink"
          >
            <option value="">{messages.world.moodCompanionNone}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.firstName} {c.lastName}
              </option>
            ))}
          </select>
        ) : null}
        <div className="rounded-card border border-dashed border-border bg-surface p-3">
          <p className="type-label mb-2 text-subtle">{messages.world.moodAddVideo}</p>
          {videoPreviewUrl || videoUrl ? (
            <div className="relative overflow-hidden rounded-xl">
              <video
                key={videoPreviewUrl || videoUrl}
                src={videoPreviewUrl || videoUrl}
                controls
                muted
                playsInline
                className="h-56 w-full bg-black object-contain"
              />
              <button
                type="button"
                onClick={clearVideoSelection}
                className="tap-scale absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-white"
                aria-label={messages.common.close}
              >
                ×
              </button>
              {uploadProgress != null ? (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 px-3 py-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="type-caption mt-1 text-white">{messages.world.videoUploading.replace("{pct}", String(uploadProgress))}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => captureInputRef.current?.click()}
                className="tap-scale flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-surface-sunken py-4 text-ink"
              >
                <CameraIcon size={20} />
                <span className="type-caption font-semibold">{messages.world.videoRecord}</span>
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="tap-scale flex flex-1 flex-col items-center gap-1.5 rounded-xl bg-surface-sunken py-4 text-ink"
              >
                <ImageIcon size={20} />
                <span className="type-caption font-semibold">{messages.world.videoImport}</span>
              </button>
            </div>
          )}
          <input
            ref={captureInputRef}
            type="file"
            accept="video/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void onVideoFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={importInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              void onVideoFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {videoError ? <p className="type-caption mt-2 text-danger">{videoError}</p> : null}
          <p className="type-caption mt-2 text-subtle">{messages.world.videoHint.replace("{seconds}", String(MAX_VIDEO_SECONDS))}</p>

          {!videoPreviewUrl && !videoFile ? (
            <div className="mt-3">
              <p className="type-caption mb-2 text-subtle">{messages.world.moodPickVideo}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {MOOD_VIDEOS.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVideoUrl((cur) => (cur === v.src ? "" : v.src));
                      setImageUrl("");
                    }}
                    className={`relative h-20 w-14 shrink-0 overflow-hidden rounded-lg ring-2 transition ${videoUrl === v.src ? "ring-accent" : "ring-transparent"}`}
                  >
                    <video src={v.src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-black/25" />
                    <span className="type-caption absolute inset-x-0 bottom-0.5 flex items-center justify-center gap-0.5 text-center font-semibold text-white drop-shadow">
                      <PlayIcon size={8} />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        </div>
      ) : null}
      {kind === "mood" || kind === "offer" ? (
        <div className="mt-3">
          <MoodPlacePicker value={place} onChange={setPlace} />
        </div>
      ) : kind !== "post" || withLoc ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <TextInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ville" />
          <TextInput value={zone} onChange={(e) => setZone(e.target.value)} placeholder="Zone" />
        </div>
      ) : null}
      <div className="mt-4 space-y-2 border-t border-divider pt-3">
        {kind !== "mood" || (!videoUrl && !videoFile) ? (
          <button
            type="button"
            className="tap-scale flex w-full items-center gap-3 rounded-xl bg-surface px-4 py-3 text-left text-ink shadow-xs"
            onClick={() => {
              setImageUrl((v) => (v ? "" : "/seed/black-white.svg"));
              setVideoUrl("");
            }}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent">
              <ImageIcon size={16} />
            </span>
            <span className="type-body-sm font-semibold">{messages.social.addImage}</span>
            <span className="ml-auto type-caption text-muted">{imageUrl ? "✓" : messages.social.noImageHint}</span>
          </button>
        ) : null}
        {kind === "post" ? (
          <button
            type="button"
            className="tap-scale flex w-full items-center gap-3 rounded-xl bg-surface px-4 py-3 text-left text-ink shadow-xs"
            onClick={() => setWithLoc((v) => !v)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-accent-soft text-accent">📍</span>
            <span className="type-body-sm font-semibold">{messages.social.addLocation}</span>
          </button>
        ) : null}
      </div>
      {error ? <p className="type-body-sm mt-3 text-danger">{error}</p> : null}
    </div>
  );
}
