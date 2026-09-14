const MAX_POST_IMAGES = 8;

export function isAllowedPostImage(url: string) {
  return url.startsWith("/seed/");
}

export function postImageList(post: { imageUrl?: string | null; imageUrls?: string[] | null }): string[] {
  const extra = Array.isArray(post.imageUrls) ? post.imageUrls.filter((u) => typeof u === "string" && u.trim()) : [];
  const first = post.imageUrl?.trim() || extra[0] || "";
  const all = first ? [first, ...extra.filter((u) => u !== first)] : extra;
  return [...new Set(all)].slice(0, MAX_POST_IMAGES);
}

export function normalizePostImages(input: { imageUrl?: string | null; imageUrls?: unknown }): string[] {
  const raw = Array.isArray(input.imageUrls) ? input.imageUrls : [];
  const urls = [...(input.imageUrl ? [input.imageUrl] : []), ...raw]
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter((u) => u && isAllowedPostImage(u));
  return [...new Set(urls)].slice(0, MAX_POST_IMAGES);
}

export const SEED_POST_IMAGES = [
  "/seed/events/black-white.jpg",
  "/seed/events/afterwork.jpg",
  "/seed/events/brunch.jpg",
  "/seed/events/piscine.jpg",
  "/seed/events/live.jpg",
  "/seed/events/expo.jpg",
  "/seed/events/rooftop.jpg",
  "/seed/posts/food.jpg",
  "/seed/posts/friends.jpg",
  "/seed/posts/drinks.jpg",
  "/seed/posts/lights.jpg",
  "/seed/posts/rooftop.jpg",
] as const;
