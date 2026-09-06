"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BookEventSheet, type BookPreview } from "@/components/BookEventSheet";
import { ErrorBanner, Skeleton } from "@/components/ui";
import { api, type EventCard } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

export default function Page() {
  return (
    <AppShell>
      <BookRoute />
    </AppShell>
  );
}

function BookRoute() {
  const { id } = useParams<{ id: string }>();
  const { messages } = useI18n();
  const router = useRouter();
  const [preview, setPreview] = useState<BookPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<EventCard>(`/events/${id}`)
      .then((event) =>
        setPreview({
          eventId: event.id,
          title: event.title,
          body: event.description ? `${event.title} : ${event.description}` : event.title,
          startsAt: event.startsAt,
          createdAt: event.createdAt,
          minAge: event.minAge,
          author: event.host,
        }),
      )
      .catch(() => setError(messages.common.error));
  }, [id, messages.common.error]);

  if (!preview && !error) return <Skeleton className="mx-4 mt-4 h-64" />;
  if (error && !preview) return <ErrorBanner message={error} />;

  return (
    <BookEventSheet
      open
      onClose={() => router.back()}
      preview={preview}
    />
  );
}
