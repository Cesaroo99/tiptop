"use client";

import { AppShell } from "@/components/AppShell";
import { MoodCameraStudio } from "@/components/MoodCameraStudio";

export default function Page() {
  return (
    <AppShell chrome="none">
      <MoodCameraStudio />
    </AppShell>
  );
}
