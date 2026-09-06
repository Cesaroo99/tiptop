export type LikePlacementKind = "user" | "post" | "comment" | "mood" | "wish";

export function parseLikePlacementKind(raw: string): LikePlacementKind | null {
  const kind = raw.toLowerCase();
  if (kind === "user" || kind === "post" || kind === "comment" || kind === "mood" || kind === "wish") {
    return kind;
  }
  return null;
}

export function clipLabel(text: string, max = 42): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

export function postLeadLabel(body: string): string {
  const idx = body.indexOf(":");
  if (idx > 0 && idx < 72) return body.slice(0, idx).trim();
  return body.trim();
}

export function likePlacementHref(
  kind: LikePlacementKind,
  ids: { id: string; username?: string | null; eventId?: string | null; postId?: string | null; moodId?: string | null },
): string {
  if (kind === "user") return ids.username ? `/u/${ids.username}` : "/likes";
  if (kind === "post") return ids.eventId ? `/events/${ids.eventId}` : `/posts/${ids.id}`;
  if (kind === "comment") {
    if (ids.postId) return `/posts/${ids.postId}`;
    if (ids.moodId) return `/mood?start=${ids.moodId}`;
    return "/likes";
  }
  if (kind === "mood") return `/mood/${ids.id}`;
  return "/wishes";
}

export function likePlacementLabel(
  kind: LikePlacementKind,
  src: { name?: string | null; title?: string | null; body?: string | null; activity?: string | null },
): string {
  if (kind === "user") return clipLabel(src.name ?? "") || "…";
  if (kind === "wish") return clipLabel(src.title ?? "") || "…";
  if (kind === "mood") return clipLabel(src.activity || src.body || "") || "Mood";
  if (kind === "post") return clipLabel(src.title || postLeadLabel(src.body ?? "")) || "…";
  return clipLabel(src.body ?? "") || "…";
}
