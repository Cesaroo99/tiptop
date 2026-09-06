export type EventGroupRole = "HOST" | "ADMIN" | "MEMBER";
export type EventGroupStatus = "INVITED" | "JOINED" | "DECLINED" | "LEFT";

export function canCreateEventGroup(isEventHost: boolean, allowGroups: boolean) {
  return isEventHost && allowGroups;
}

export function canAdministerGroup(role: EventGroupRole | null | undefined, isEventHost: boolean) {
  return isEventHost || role === "HOST" || role === "ADMIN";
}

export function canPromoteAdmin(role: EventGroupRole | null | undefined, isEventHost: boolean) {
  return isEventHost || role === "HOST";
}

export function canLeaveGroup(status: EventGroupStatus | null | undefined, role: EventGroupRole | null | undefined) {
  return status === "JOINED" && role !== "HOST";
}

export function canRespondToGroupInvite(status: EventGroupStatus | null | undefined) {
  return status === "INVITED";
}

export function groupNameOk(name: string) {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 60;
}
