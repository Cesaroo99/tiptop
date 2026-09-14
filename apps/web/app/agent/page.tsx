"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PrimaryButton, ScreenHeader, TextInput } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { ExperiencePlanView } from "@/lib/intelligence";

type Suggestion = {
  id: string;
  title: string;
  body: string;
  fromAgent: boolean;
  planId: string | null;
};

export default function Page() {
  return (
    <AppShell chrome="nav">
      <AgentScreen />
    </AppShell>
  );
}

function AgentScreen() {
  const { messages } = useI18n();
  const router = useRouter();
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ enabled: boolean; items: Suggestion[] }>("/intelligence/agent")
      .then((data) => {
        setEnabled(data.enabled);
        setItems(data.items ?? []);
      })
      .catch(() => setEnabled(false));
  }, []);

  async function ask() {
    setError(null);
    try {
      const res = await api<{ suggestion: Suggestion; plan: ExperiencePlanView }>("/intelligence/agent/ask", {
        method: "POST",
        body: JSON.stringify({ text: text || messages.intel.agentHint }),
      });
      setItems((cur) => [res.suggestion, ...cur]);
      setText("");
      if (res.plan?.id) router.push("/plan");
    } catch (e) {
      setError(e instanceof ApiError && String(e.code).includes("AGENT") ? messages.intel.agentOff : messages.intel.rateLimit);
    }
  }

  return (
    <div className="px-4 py-4">
      <ScreenHeader title={messages.intel.agentTitle} onBack={() => router.back()} />
      {!enabled ? <p className="type-body-sm mt-4 text-muted">{messages.intel.agentOff}</p> : null}
      <TextInput value={text} onChange={(e) => setText(e.target.value)} placeholder={messages.intel.agentHint} className="mt-4" />
      <div className="mt-3">
        <PrimaryButton onClick={() => void ask()}>{messages.intel.agentAsk}</PrimaryButton>
      </div>
      {error ? <p className="type-caption mt-2 text-danger">{error}</p> : null}
      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-card bg-surface p-4 shadow-card">
            {item.fromAgent ? <p className="type-caption text-accent">{messages.intel.fromAgent}</p> : null}
            <p className="type-heading text-ink">{item.title}</p>
            <p className="type-body-sm mt-1 text-muted">{item.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
