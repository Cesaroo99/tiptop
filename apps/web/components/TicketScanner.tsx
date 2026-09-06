"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { PrimaryButton, ScreenHeader, TextInput } from "./ui";

type ScanResult = {
  ok?: boolean;
  holder?: { firstName: string; lastName: string; username: string };
};

declare global {
  interface Window {
    BarcodeDetector?: new (opts?: { formats?: string[] }) => {
      detect: (source: CanvasImageSource) => Promise<Array<{ rawValue?: string }>>;
    };
  }
}

export function TicketScanner({
  eventId,
  onBack,
}: {
  eventId: string;
  onBack: () => void;
}) {
  const { messages } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [token, setToken] = useState("");
  const [camera, setCamera] = useState<"on" | "denied" | "off">("off");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastRef = useRef<string>("");

  async function submit(value: string) {
    const raw = value.trim();
    if (!raw || busy || lastRef.current === raw) return;
    lastRef.current = raw;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api<ScanResult>("/tickets/scan", {
        method: "POST",
        body: JSON.stringify({ token: raw }),
      });
      const who = res.holder ? `${res.holder.firstName} ${res.holder.lastName}` : "";
      setResult(who ? `${messages.booking.scanOk} — ${who}` : messages.booking.scanOk);
    } catch (e) {
      lastRef.current = "";
      if (e instanceof ApiError && e.code === "ALREADY_CONSUMED") setError(messages.booking.alreadyConsumed);
      else if (e instanceof ApiError && e.code === "ENTRY_WINDOW") setError(messages.booking.entryClosed);
      else if (e instanceof ApiError && e.code === "NOT_HOST") setError(messages.booking.notHost);
      else setError(messages.booking.invalidQr);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let timer: number | null = null;
    let stopped = false;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("denied");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        setCamera("on");
        const Detector = window.BarcodeDetector;
        if (!Detector) return;
        const detector = new Detector({ formats: ["qr_code"] });
        const tick = async () => {
          if (stopped || !videoRef.current || videoRef.current.readyState < 2) {
            timer = window.setTimeout(() => void tick(), 280);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            const raw = codes[0]?.rawValue;
            if (raw) await submit(raw);
          } catch {
            /* frame skip */
          }
          timer = window.setTimeout(() => void tick(), 280);
        };
        void tick();
      } catch {
        setCamera("denied");
      }
    }

    void start();
    return () => {
      stopped = true;
      if (timer != null) window.clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <div className="flex min-h-full flex-col">
      <ScreenHeader title={messages.booking.scanTitle} onBack={onBack} />
      <div className="space-y-4 px-4 pb-8">
        <p className="type-body-sm text-muted">
          {camera === "denied" ? messages.booking.scanCameraDenied : messages.booking.scanCameraHint}
        </p>
        <div className="relative overflow-hidden rounded-card bg-ink shadow-card">
          <video ref={videoRef} playsInline muted className="aspect-[3/4] w-full object-cover" />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="h-40 w-40 rounded-2xl border-2 border-accent/90 shadow-[0_0_0_999px_rgba(13,13,13,0.35)]" />
          </div>
        </div>
        {result ? <p className="type-body-sm font-semibold text-success">{result}</p> : null}
        {error ? <p className="type-body-sm font-semibold text-danger">{error}</p> : null}
        {result ? (
          <PrimaryButton
            onClick={() => {
              lastRef.current = "";
              setResult(null);
              setError(null);
              setToken("");
            }}
          >
            {messages.booking.scanNext}
          </PrimaryButton>
        ) : null}
        <TextInput
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={messages.booking.scanPaste}
          aria-label={messages.booking.scanPaste}
        />
        <PrimaryButton loading={busy} disabled={!token.trim() || busy} onClick={() => void submit(token)}>
          {messages.booking.validateTicket}
        </PrimaryButton>
      </div>
    </div>
  );
}
