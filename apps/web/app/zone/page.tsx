"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ScreenHeader } from "@/components/ui";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/session";

type Zone = { city: string; zone: string };

export default function ZonePage() {
  const { messages } = useI18n();
  const { user, refresh } = useSession();
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [precision, setPrecision] = useState(user?.locationPrecision ?? "ZONE");

  useEffect(() => {
    api<{ zones: Zone[] }>("/geo/zones")
      .then((d) => setZones(d.zones))
      .catch(() => setZones([]));
  }, []);

  async function pick(z: Zone) {
    await api("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ city: z.city, zone: z.zone, locationPrecision: precision }),
    });
    await refresh();
    router.back();
  }

  async function savePrecision(p: string) {
    setPrecision(p);
    await api("/users/me", { method: "PATCH", body: JSON.stringify({ locationPrecision: p }) });
    await refresh();
  }

  const precisions = [
    ["EXACT", messages.world.precisionExact],
    ["ZONE", messages.world.precisionZone],
    ["CITY", messages.world.precisionCity],
    ["HIDDEN", messages.world.precisionHidden],
  ] as const;

  return (
    <main className="mx-auto min-h-dvh max-w-lg px-4 py-4">
      <ScreenHeader title={messages.world.zoneTitle} onBack={() => router.back()} />
      <p className="mb-4 text-sm text-muted">{messages.world.zoneBody}</p>
      <p className="mb-2 text-sm font-semibold">{messages.world.precision}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {precisions.map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => void savePrecision(k)}
            className={`rounded-pill px-3 py-1.5 text-sm ${precision === k ? "bg-accent text-white" : "bg-[var(--border)]"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {zones.map((z) => (
          <button
            key={`${z.city}-${z.zone}`}
            type="button"
            onClick={() => void pick(z)}
            className={`block w-full rounded-card p-4 text-left shadow-card ${user?.zone === z.zone ? "bg-accent/10" : "bg-surface"}`}
          >
            <p className="font-semibold text-ink">
              {z.city} - {z.zone}
            </p>
          </button>
        ))}
      </div>
    </main>
  );
}
