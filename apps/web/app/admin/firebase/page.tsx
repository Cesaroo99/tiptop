"use client";

import { AdminShell } from "@/components/AdminShell";
import { adminCopy } from "@/lib/admin-copy";

const ITEMS = [
  ["Authentication", "TipTop utilise OTP téléphone + cookie de session. Pas Firebase Auth."],
  ["Firestore", "Les données sont dans PostgreSQL via Prisma."],
  ["Storage", "Médias = URLs locales / seed. Pas Firebase Storage."],
  ["FCM", "PushService est un no-op. Notifications in-app uniquement."],
  ["App Check", "Non implémenté."],
];

export default function Page() {
  return (
    <AdminShell>
      <p className="mb-3 rounded-card bg-zinc-100 p-3 text-sm">⚪ {adminCopy.noFirebase}</p>
      {ITEMS.map(([title, body]) => (
        <article key={title} className="mb-2 rounded-card bg-surface p-4 shadow-card">
          <p className="font-semibold">🔴 Non configuré — {title}</p>
          <p className="mt-1 text-xs text-muted">{body}</p>
        </article>
      ))}
    </AdminShell>
  );
}
