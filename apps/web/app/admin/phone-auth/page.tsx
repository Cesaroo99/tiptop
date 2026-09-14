"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";

type Phone = {
  settings: {
    allowedCountries: string[];
    maxPerUserHour: number;
    maxPerIpHour: number;
    cooldownSeconds: number;
    maxAttempts: number;
    expirySeconds: number;
  };
  mockEnabled: boolean;
  last24h: { challenges: number; locked: number; estimatedSmsCostXaf: number };
  note: string;
};

export default function Page() {
  const [data, setData] = useState<Phone | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api<Phone>("/admin/phone-auth")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <AdminShell>
        <p className="text-sm text-muted">Chargement…</p>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <p className="mb-3 text-sm text-muted">{data.note}</p>
      <p className="mb-3 text-sm">
        OTP mock : {data.mockEnabled ? "actif" : "off"} · défis 24h {data.last24h.challenges} · verrouillés {data.last24h.locked} ·
        coût SMS estimé {data.last24h.estimatedSmsCostXaf} XAF
      </p>
      <label className="mb-2 block text-sm">
        Pays autorisés (CSV)
        <input
          defaultValue={data.settings.allowedCountries.join(",")}
          className="mt-1 w-full rounded-pill border border-[var(--border)] px-3 py-2"
          onBlur={(e) =>
            void api("/admin/phone-auth", {
              method: "PATCH",
              body: JSON.stringify({ ...data.settings, allowedCountries: e.target.value.split(",").map((x) => x.trim()) }),
            })
              .then(() => setMsg("Enregistré"))
              .catch(() => setMsg("Permission settings.write"))
          }
        />
      </label>
      {msg ? <p className="text-xs text-accent">{msg}</p> : null}
    </AdminShell>
  );
}
