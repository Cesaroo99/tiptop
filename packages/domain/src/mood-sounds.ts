export const MOOD_SOUND_KEYS = ["original", "off", "pulse", "night", "glow"] as const;
export type MoodSoundKey = (typeof MOOD_SOUND_KEYS)[number];

export const MOOD_SOUND_FILES: Record<Exclude<MoodSoundKey, "original" | "off">, string> = {
  pulse: "/seed/moods/sounds/pulse.wav",
  night: "/seed/moods/sounds/night.wav",
  glow: "/seed/moods/sounds/glow.wav",
};

export function isMoodSoundKey(value: string | null | undefined): value is MoodSoundKey {
  return Boolean(value && (MOOD_SOUND_KEYS as readonly string[]).includes(value));
}

export function moodSoundSrc(key: string | null | undefined): string | null {
  if (key === "pulse" || key === "night" || key === "glow") return MOOD_SOUND_FILES[key];
  return null;
}
