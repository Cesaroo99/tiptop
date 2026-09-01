"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PrimaryButton, TextInput } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <ScanView />
    </AppShell>
  );
}

function ScanView() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      await api("/tickets/scan", { method: "POST", body: JSON.stringify({ token }) });
      setResult(messages.booking.scanOk);
    } catch (e) {
      if (e instanceof ApiError && e.code === "ALREADY_CONSUMED") setError(messages.booking.alreadyConsumed);
      else if (e instanceof ApiError && e.code === "ENTRY_WINDOW") setError(messages.booking.entryClosed);
      else if (e instanceof ApiError && e.code === "NOT_HOST") setError(messages.booking.notHost);
      else setError(messages.booking.invalidQr);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 py-6">
      <h1 className="text-lg font-semibold">{messages.booking.scanTitle}</h1>
      <p className="mt-2 text-sm text-muted">{messages.booking.ticketQrHint}</p>
      <div className="mt-4">
        <TextInput value={token} onChange={(e) => setToken(e.target.value)} placeholder={messages.booking.scanPaste} />
      </div>
      {result ? <p className="mt-3 text-sm text-success">{result}</p> : null}
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-6 space-y-3">
        <PrimaryButton loading={loading} disabled={!token.trim()} onClick={() => void scan()}>
          {messages.booking.validateTicket}
        </PrimaryButton>
        <button type="button" className="w-full text-sm text-accent" onClick={() => router.push(`/events/${id}/manage`)}>
          {messages.booking.manageEvent}
        </button>
      </div>
    </div>
  );
}
