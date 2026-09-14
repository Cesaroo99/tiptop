"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { api } from "@/lib/api";
import { adminCopy } from "@/lib/admin-copy";

type Maps = {
  provider: string;
  googleConfigured: boolean;
  privacy: string;
  events: Array<{ id: string; title: string; city: string; address: string | null; latitude: number | null; longitude: number | null; status: string }>;
};

export default function Page() {
  const [data, setData] = useState<Maps | null>(null);

  useEffect(() => {
    api<Maps>("/admin/maps")
      .then(setData)
      .catch(() => setData(null));
  }, []);

  return (
    <AdminShell>
      <p className="mb-3 rounded-card bg-amber-50 p-3 text-sm">{adminCopy.noGoogleMaps}</p>
      {data ? (
        <>
          <p className="text-sm">Provider carte : {data.provider}</p>
          <p className="mb-3 text-xs text-muted">{data.privacy}</p>
          {data.events.map((e) => (
            <Link key={e.id} href={`/admin/events/${e.id}`} className="mb-2 block rounded-card bg-surface p-3 shadow-card">
              <p className="font-semibold">{e.title}</p>
              <p className="text-xs text-muted">
                {e.city} · {e.address} · {e.latitude}, {e.longitude}
              </p>
            </Link>
          ))}
        </>
      ) : (
        <p className="text-sm text-muted">Chargement…</p>
      )}
    </AdminShell>
  );
}
