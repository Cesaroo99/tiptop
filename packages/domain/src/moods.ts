/** Mood pérenne public vs Statut 24 h amis. */

export const STATUS_HOURS = 24;

export const MOOD_KINDS = ["MOOD", "STATUS"] as const;
export type MoodKind = (typeof MOOD_KINDS)[number];

export const MOOD_INTERESTS = [
  { id: "concert", fr: "Concert", en: "Concert" },
  { id: "food", fr: "Food", en: "Food" },
  { id: "rooftop", fr: "Rooftop", en: "Rooftop" },
  { id: "piscine", fr: "Piscine", en: "Pool" },
  { id: "nightlife", fr: "Nuit", en: "Nightlife" },
  { id: "sport", fr: "Sport", en: "Sport" },
  { id: "culture", fr: "Culture", en: "Culture" },
  { id: "travel", fr: "Voyage", en: "Travel" },
  { id: "fashion", fr: "Mode", en: "Fashion" },
  { id: "hangout", fr: "Sortie", en: "Hangout" },
] as const;

export type MoodInterestId = (typeof MOOD_INTERESTS)[number]["id"];

export function isMoodKind(value: unknown): value is MoodKind {
  return typeof value === "string" && (MOOD_KINDS as readonly string[]).includes(value);
}

export function isMoodInterest(value: unknown): value is MoodInterestId {
  return typeof value === "string" && MOOD_INTERESTS.some((item) => item.id === value);
}

export function parseMoodInterests(values: unknown): MoodInterestId[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.filter(isMoodInterest))];
}

export function interestFromActivity(activity?: string | null): MoodInterestId | null {
  const text = (activity ?? "").toLowerCase();
  if (!text.trim()) return null;
  if (/concert|musique|live|🎵/.test(text)) return "concert";
  if (/resto|food|sushi|restaurant|🍽️/.test(text)) return "food";
  if (/rooftop|🌅|🌆/.test(text)) return "rooftop";
  if (/piscine|pool|🏖️/.test(text)) return "piscine";
  if (/club|night|nuit|after/.test(text)) return "nightlife";
  if (/sport|foot|gym/.test(text)) return "sport";
  if (/expo|culture|art/.test(text)) return "culture";
  if (/voyage|travel/.test(text)) return "travel";
  if (/mode|fashion/.test(text)) return "fashion";
  return "hangout";
}

export function statusExpiresAt(from: Date): Date {
  return new Date(from.getTime() + STATUS_HOURS * 3600_000);
}

export function moodInterestScore(moodInterest: string | null | undefined, viewerInterests: string[]): number {
  if (!moodInterest || viewerInterests.length === 0) return 0;
  return viewerInterests.includes(moodInterest) ? 1 : 0;
}
