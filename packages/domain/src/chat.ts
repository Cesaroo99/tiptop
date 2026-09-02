/** Chat 1:1 / groupes, présence, push (D26–D27). */

export type ConversationKind = "DIRECT" | "GROUP" | "EVENT";
export type MessageKind = "TEXT" | "IMAGE" | "AUDIO";
export type PushCategory = "messages" | "social" | "events" | "invitations" | "mood";

export const PRESENCE_WINDOW_MS = 90_000;

export function directKey(userA: string, userB: string): string {
  return [userA, userB].sort().join(":");
}

export function canStartDirect(actorId: string, peerId: string): "OK" | "CHAT_SELF" {
  if (actorId === peerId) return "CHAT_SELF";
  return "OK";
}

export function pairIsBlocked(
  blocks: Array<{ blockerId: string; blockedId: string }>,
  userA: string,
  userB: string,
): boolean {
  return blocks.some(
    (b) =>
      (b.blockerId === userA && b.blockedId === userB) || (b.blockerId === userB && b.blockedId === userA),
  );
}

/** Anti-spam messagerie (#56) : débit raisonnable par minute, pas de blocage
 * pour un usage normal (conversation rapide) mais empêche un flux automatisé. */
export const MESSAGE_RATE_LIMIT_PER_MINUTE = 30;
/** Anti-spam prospection (#56) : limite le nombre de NOUVELLES conversations
 * privées ouvertes par jour, pour éviter le démarchage massif d'inconnus. */
export const NEW_DIRECT_CONVERSATION_DAILY_LIMIT = 30;

export function canSendMessage(input: {
  isMember: boolean;
  blocked: boolean;
  kind: MessageKind;
  body?: string | null;
  imageUrl?: string | null;
  recentMessageCount?: number;
}): "OK" | "NOT_MEMBER" | "BLOCKED" | "EMPTY" | "RATE_LIMITED" {
  if (!input.isMember) return "NOT_MEMBER";
  if (input.blocked) return "BLOCKED";
  if (input.kind === "TEXT" && !(input.body ?? "").trim()) return "EMPTY";
  if (input.kind === "IMAGE" && !input.imageUrl) return "EMPTY";
  if ((input.recentMessageCount ?? 0) >= MESSAGE_RATE_LIMIT_PER_MINUTE) return "RATE_LIMITED";
  return "OK";
}

export function canOpenNewDirectConversation(recentNewConversationCount: number): "OK" | "RATE_LIMITED" {
  return recentNewConversationCount >= NEW_DIRECT_CONVERSATION_DAILY_LIMIT ? "RATE_LIMITED" : "OK";
}

export function isRecentlyOnline(lastSeenAt: Date | null | undefined, now = new Date(), windowMs = PRESENCE_WINDOW_MS): boolean {
  if (!lastSeenAt) return false;
  return now.getTime() - lastSeenAt.getTime() < windowMs;
}

export function shouldNotifyOffline(input: { viewingThread: boolean; pushEnabled: boolean }): boolean {
  if (input.viewingThread) return false;
  return input.pushEnabled;
}

export function eventGroupTitle(eventTitle: string): string {
  return eventTitle.trim() || "Sortie";
}
