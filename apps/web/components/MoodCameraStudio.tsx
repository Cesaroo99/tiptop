"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { moodSoundSrc, type MoodSoundKey } from "@tiptop/domain";
import { CloseIcon, LocateIcon, MusicIcon, PinIcon } from "./Icons";
import { MoodPlacePicker, type PickedPlace } from "./MoodPlacePicker";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { moodSoundChoices } from "@/lib/mood-sounds";
import { sheetOverlayClass, useSheetPortal } from "@/lib/sheet-portal";

const MAX_VIDEO_SECONDS = 90;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
const TEMPLATES = [
  { id: "concert", label: "Concert", src: "/seed/moods/video-concert.mp4" },
  { id: "piscine", label: "Piscine", src: "/seed/moods/video-piscine.mp4" },
  { id: "rooftop", label: "Rooftop", src: "/seed/moods/video-rooftop.mp4" },
  { id: "food", label: "Restaurant", src: "/seed/moods/video-food.mp4" },
];

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
          resolve((JSON.parse(xhr.responseText) as { url: string }).url);
        } catch {
          reject(new Error("UPLOAD_PARSE_ERROR"));
        }
      } else reject(new Error("UPLOAD_FAILED"));
    };
    xhr.onerror = () => reject(new Error("UPLOAD_FAILED"));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function MoodCameraStudio() {
  const { messages } = useI18n();
  const router = useRouter();
  const liveRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"capture" | "edit">("capture");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [liveReady, setLiveReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [body, setBody] = useState("");
  const [soundKey, setSoundKey] = useState<MoodSoundKey>("original");
  const [place, setPlace] = useState<PickedPlace | null>(null);
  const [sheet, setSheet] = useState<"text" | "sound" | "place" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (stage !== "capture") return;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing }, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (liveRef.current) {
          liveRef.current.srcObject = stream;
          void liveRef.current.play().catch(() => undefined);
        }
        setLiveReady(true);
        setCameraError(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLiveReady(false);
          setCameraError(true);
        }
      });
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing, stage]);

  useEffect(() => {
    if (!recording) return;
    const started = Date.now();
    const t = window.setInterval(() => {
      const sec = Math.floor((Date.now() - started) / 1000);
      setElapsed(sec);
      if (sec >= MAX_VIDEO_SECONDS) stopRecord();
    }, 250);
    return () => window.clearInterval(t);
  }, [recording]);

  function stopLive() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (liveRef.current) liveRef.current.srcObject = null;
  }

  function useClip(nextFile: File | null, nextUrl: string, objectUrl?: string) {
    stopLive();
    setFile(nextFile);
    setVideoUrl(nextUrl);
    setPreview(objectUrl || nextUrl);
    setStage("edit");
    setRecording(false);
    setElapsed(0);
  }

  function onPickedFile(picked?: File) {
    if (!picked) return;
    setError(null);
    if (!picked.type.startsWith("video/")) {
      setError(messages.world.videoTypeError);
      return;
    }
    if (picked.size > MAX_VIDEO_BYTES) {
      setError(messages.world.videoTooLarge);
      return;
    }
    useClip(picked, "", URL.createObjectURL(picked));
  }

  function startRecord() {
    const stream = streamRef.current;
    if (!stream) {
      captureInputRef.current?.click();
      return;
    }
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "";
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    rec.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
      const clip = new File([blob], `mood-${Date.now()}.webm`, { type: blob.type });
      useClip(clip, "", URL.createObjectURL(blob));
    };
    recorderRef.current = rec;
    rec.start(200);
    setRecording(true);
    setElapsed(0);
  }

  function stopRecord() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setRecording(false);
  }

  function retake() {
    if (preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    setFile(null);
    setVideoUrl("");
    setPreview("");
    setBody("");
    setSoundKey("original");
    setPlace(null);
    setSheet(null);
    setStage("capture");
  }

  async function publish() {
    if (publishing || (!file && !videoUrl)) return;
    setPublishing(true);
    setError(null);
    try {
      let finalUrl = videoUrl;
      if (file) {
        setProgress(0);
        finalUrl = await uploadVideo(file, setProgress);
        setProgress(null);
      }
      const sounds = moodSoundChoices(messages.world);
      const sound = sounds.find((s) => s.key === soundKey);
      await api("/moods", {
        method: "POST",
        body: JSON.stringify({
          body: body.trim() || undefined,
          videoUrl: finalUrl,
          soundKey,
          soundLabel: soundKey === "original" || soundKey === "off" ? undefined : sound?.label,
          placeName: place?.placeName || undefined,
          address: place?.address || undefined,
          city: place?.city || undefined,
          zone: place?.zone || undefined,
          latitude: place?.latitude ?? undefined,
          longitude: place?.longitude ?? undefined,
        }),
      });
      router.replace("/mood");
    } catch {
      setError(messages.world.videoUploadError);
      setProgress(null);
    } finally {
      setPublishing(false);
    }
  }

  const sounds = moodSoundChoices(messages.world);
  const soundLabel = sounds.find((s) => s.key === soundKey)?.label ?? messages.world.moodSoundOriginal;
  const track = moodSoundSrc(soundKey);

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-ink text-white">
      {stage === "capture" ? (
        <>
          <video ref={liveRef} muted playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" />
          {!liveReady ? (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-ink via-ink to-accent/40 px-8 text-center">
              <p className="type-body-sm text-white/80">
                {cameraError ? messages.world.moodCameraDenied : messages.world.moodCameraHint}
              </p>
            </div>
          ) : null}
          <div className="phone-safe-top pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label={messages.common.close}
              className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/35"
            >
              <CloseIcon size={18} />
            </button>
            {recording ? (
              <span className="rounded-pill bg-danger px-2.5 py-1 text-[12px] font-bold tabular-nums">{elapsed}s</span>
            ) : (
              <p className="type-caption font-semibold drop-shadow">{messages.world.moodCameraHint}</p>
            )}
            <button
              type="button"
              onClick={() => setFacing((v) => (v === "user" ? "environment" : "user"))}
              className="pointer-events-auto type-caption rounded-pill bg-black/35 px-3 py-2 font-semibold"
            >
              {messages.world.moodFlip}
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-10 flex items-end justify-between px-6">
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="type-caption font-semibold"
            >
              {messages.world.videoImport}
            </button>
            <button
              type="button"
              onClick={() => (recording ? stopRecord() : startRecord())}
              aria-label={recording ? messages.world.moodStopRecord : messages.world.videoRecord}
              className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white"
            >
              <span className={`rounded-full bg-danger transition ${recording ? "h-7 w-7" : "h-14 w-14"}`} />
            </button>
            <button type="button" onClick={() => captureInputRef.current?.click()} className="type-caption font-semibold">
              {messages.world.videoRecord}
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-[6.4rem] z-10 px-4">
            <p className="type-caption mb-2 font-semibold text-white/80">{messages.world.moodPickVideo}</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => useClip(null, t.src)}
                  className="shrink-0 rounded-xl bg-white/15 px-3 py-2 type-caption font-semibold backdrop-blur"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          <video src={preview} muted={soundKey !== "original"} loop playsInline autoPlay className="absolute inset-0 h-full w-full object-cover" />
          {track ? <audio src={track} autoPlay loop /> : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/70" />
          <div className="phone-safe-top absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4">
            <button type="button" onClick={retake} className="type-caption rounded-pill bg-black/35 px-3 py-2 font-semibold">
              {messages.world.moodRetake}
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={() => void publish()}
              className="tap-scale rounded-pill bg-accent px-4 py-2 type-caption font-bold text-on-primary disabled:opacity-40"
            >
              {progress != null ? messages.world.videoUploading.replace("{pct}", String(progress)) : messages.social.publish}
            </button>
          </div>
          <div className="absolute right-3 z-10 flex flex-col items-center gap-3" style={{ bottom: "max(7.5rem, calc(7rem + env(safe-area-inset-bottom)))" }}>
            <StudioChip label={messages.world.moodAddText} onClick={() => setSheet("text")}>
              <span className="text-[15px] font-bold">Aa</span>
            </StudioChip>
            <StudioChip label={messages.world.moodAddSound} onClick={() => setSheet("sound")}>
              <MusicIcon size={18} />
            </StudioChip>
            <StudioChip label={messages.world.moodUseMyLocation} onClick={() => setSheet("place")}>
              <LocateIcon size={18} />
            </StudioChip>
          </div>
          <div className="absolute inset-x-0 z-10 px-4 pr-16" style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>
            {place?.placeName ? (
              <p className="mb-2 inline-flex items-center gap-1 rounded-pill bg-black/40 px-2.5 py-1 type-caption font-semibold">
                <PinIcon size={12} /> {place.placeName}
              </p>
            ) : null}
            {body ? <p className="type-body-sm mb-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">{body}</p> : null}
            <p className="type-caption font-semibold opacity-90">
              {soundKey === "original"
                ? messages.world.moodAudioOriginal
                : soundKey === "off"
                  ? messages.world.moodSoundOff
                  : messages.world.moodAudioNamed.replace("{name}", soundLabel)}
            </p>
          </div>
        </>
      )}
      {error ? (
        <p className="absolute inset-x-4 top-20 z-20 rounded-xl bg-danger px-3 py-2 type-caption font-semibold">{error}</p>
      ) : null}
      <input ref={captureInputRef} type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => { onPickedFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={importInputRef} type="file" accept="video/*" className="hidden" onChange={(e) => { onPickedFile(e.target.files?.[0]); e.target.value = ""; }} />
      <EditorSheet open={sheet === "text"} title={messages.world.moodAddText} onClose={() => setSheet(null)}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 500))}
          placeholder={messages.social.saySomething}
          className="type-body-sm min-h-[7rem] w-full resize-none rounded-2xl bg-surface-sunken px-3 py-3 text-ink outline-none"
        />
      </EditorSheet>
      <EditorSheet open={sheet === "sound"} title={messages.world.moodSoundTitle} onClose={() => setSheet(null)}>
        <div className="space-y-2">
          {sounds.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setSoundKey(s.key);
                setSheet(null);
              }}
              className={`flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-left ${
                soundKey === s.key ? "bg-accent-soft font-semibold text-accent" : "bg-surface-sunken text-ink"
              }`}
            >
              <span className="type-body-sm">{s.label}</span>
              {soundKey === s.key ? <MusicIcon size={14} /> : null}
            </button>
          ))}
        </div>
      </EditorSheet>
      <EditorSheet open={sheet === "place"} title={messages.world.moodUseMyLocation} onClose={() => setSheet(null)}>
        <MoodPlacePicker value={place} onChange={setPlace} alwaysOpen />
      </EditorSheet>
    </div>
  );
}

function StudioChip({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="tap-scale flex flex-col items-center gap-1">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-white/18 text-white backdrop-blur-md">{children}</span>
      <span className="max-w-[4.4rem] truncate text-center text-[10px] font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.75)]">
        {label}
      </span>
    </button>
  );
}

function EditorSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const portal = useSheetPortal();
  if (!open || !portal) return null;
  return createPortal(
    <div className={sheetOverlayClass(portal)} role="dialog" aria-modal aria-label={title} onClick={onClose}>
      <div
        className="sheet-panel max-h-[min(68dvh,520px)] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-surface px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-border" aria-hidden />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="type-h3 text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="type-caption font-semibold text-muted">
            OK
          </button>
        </div>
        {children}
      </div>
    </div>,
    portal,
  );
}
