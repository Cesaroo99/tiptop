import type { PersonCard } from "./api";

export function whyCaption(
  reason: { key: string; count?: number },
  messages: {
    world: {
      whySharedInterests: string;
      whySharedInterestsOne: string;
      whyNearbyAvailable: string;
      whyMood: string;
    };
  },
): string | null {
  if (reason.key === "shared_interests") {
    const count = reason.count ?? 0;
    if (count <= 0) return null;
    return count === 1
      ? messages.world.whySharedInterestsOne
      : messages.world.whySharedInterests.replace("{count}", String(count));
  }
  if (reason.key === "nearby_available") return messages.world.whyNearbyAvailable;
  if (reason.key === "mood") return messages.world.whyMood;
  return null;
}

export function personWhyLines(person: PersonCard, messages: Parameters<typeof whyCaption>[1]): string[] {
  return (person.why ?? []).map((reason) => whyCaption(reason, messages)).filter((line): line is string => Boolean(line));
}
