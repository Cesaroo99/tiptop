export const NOTIFICATION_GROUP_WINDOW_MS = 6 * 60 * 60 * 1000;

export type GroupableNotification = {
  type: string;
  entityType: string | null;
  entityId: string | null;
  createdAt: string | Date;
  actor: { id: string } | null;
  count?: number;
};

function groupKey(n: GroupableNotification): string | null {
  if (n.type === "LIKE" || n.type === "COMMENT") {
    return `${n.type}|${n.entityType ?? ""}|${n.entityId ?? ""}`;
  }
  if (n.type === "FOLLOW" && n.actor?.id) {
    return `FOLLOW|${n.actor.id}`;
  }
  return null;
}

/**
 * Regroupe les notifs sociales d’une même cible (ou le même follow)
 * dans une fenêtre de 6 h. Les items sont supposés du plus récent au plus ancien.
 * Ne touche pas au unreadCount brut — affichage seulement.
 */
export function groupNotifications<T extends GroupableNotification>(items: T[]): T[] {
  const index = new Map<string, T & { count: number }>();
  const out: Array<T & { count: number }> = [];
  for (const item of items) {
    const key = groupKey(item);
    if (!key) {
      out.push({ ...item, count: item.count ?? 1 });
      continue;
    }
    const prev = index.get(key);
    const t = new Date(item.createdAt).getTime();
    if (prev && Math.abs(new Date(prev.createdAt).getTime() - t) <= NOTIFICATION_GROUP_WINDOW_MS) {
      prev.count += 1;
      continue;
    }
    const copy = { ...item, count: item.count ?? 1 };
    index.set(key, copy);
    out.push(copy);
  }
  return out;
}
