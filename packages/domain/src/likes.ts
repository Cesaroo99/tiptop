/**
 * Attribution d'unités de like — règles pures (Phase 2 branchera l'API dessus).
 * Un LikeUnit ne peut pas être alloué à deux personnes à la fois.
 */

export type LikeUnit = {
  id: string;
  ownerId: string;
  source: "free" | "purchased" | "certified_bonus";
  activeAllocationUserId: string | null;
};

export type LikeTransfer = {
  unitId: string;
  fromBeneficiaryId: string | null;
  toBeneficiaryId: string;
};

export function assertCanAllocate(unit: LikeUnit, toUserId: string, ownerId: string): void {
  if (unit.ownerId !== ownerId) {
    throw new Error("LIKE_NOT_OWNED");
  }
  if (toUserId === ownerId) {
    throw new Error("LIKE_SELF");
  }
}

export function planTransfer(unit: LikeUnit, toUserId: string, ownerId: string): LikeTransfer {
  assertCanAllocate(unit, toUserId, ownerId);
  if (unit.activeAllocationUserId === toUserId) {
    throw new Error("LIKE_ALREADY_ON_TARGET");
  }
  return {
    unitId: unit.id,
    fromBeneficiaryId: unit.activeAllocationUserId,
    toBeneficiaryId: toUserId,
  };
}

export function availableBalance(units: LikeUnit[]): number {
  return units.filter((u) => u.activeAllocationUserId === null).length;
}

export type HeartAllocation = {
  userId: string;
  eventId: string;
};

export function planHeartTransfer(
  current: HeartAllocation | null,
  userId: string,
  eventId: string,
): { fromEventId: string | null; toEventId: string } {
  if (current && current.userId !== userId) {
    throw new Error("HEART_NOT_OWNED");
  }
  if (current?.eventId === eventId) {
    throw new Error("HEART_ALREADY_ON_TARGET");
  }
  return { fromEventId: current?.eventId ?? null, toEventId: eventId };
}

export function likesPerHour(receivedInWindow: number, windowHours: number): number {
  if (windowHours <= 0) return 0;
  return receivedInWindow / windowHours;
}

export function displayLikeRatio(
  likesPerHourValue: number,
  influencerThreshold: number,
): { value: number; unit: "hour" | "second" } {
  if (likesPerHourValue >= influencerThreshold) {
    return { value: likesPerHourValue / 3600, unit: "second" };
  }
  return { value: likesPerHourValue, unit: "hour" };
}
