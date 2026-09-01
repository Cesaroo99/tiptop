/**
 * Un compte = un like personnel (source free), transférable.
 * Il ne peut être posé que chez une personne à la fois.
 * Les likes reçus (stock + rythme) sont ce que chacun « produit ».
 */

export const INFLUENCER_THRESHOLD_LIKES_PER_HOUR = 50;

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

/** Unité personnelle : le like unique (free). Bonus certifié legacy = même jeton. */
export function personalLikeUnits(units: LikeUnit[]): LikeUnit[] {
  const personal = units.filter((u) => u.source === "free" || u.source === "certified_bonus");
  return personal.length ? personal : [];
}

/** Choisit le like personnel : s’il est déjà posé ailleurs, c’est un transfert. */
export function pickUnitForLike(units: LikeUnit[], toUserId: string, ownerId: string): LikeTransfer {
  const personal = personalLikeUnits(units);
  if (personal.length === 0) throw new Error("LIKE_NO_UNITS");
  if (personal.some((u) => u.activeAllocationUserId === toUserId)) {
    throw new Error("LIKE_ALREADY_ON_TARGET");
  }
  const placed = personal.find((u) => u.activeAllocationUserId !== null) ?? personal[0];
  return planTransfer(placed, toUserId, ownerId);
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
  influencerThreshold: number = INFLUENCER_THRESHOLD_LIKES_PER_HOUR,
): { value: number; unit: "hour" | "second" } {
  if (likesPerHourValue >= influencerThreshold) {
    return { value: likesPerHourValue / 3600, unit: "second" };
  }
  return { value: likesPerHourValue, unit: "hour" };
}

export type LikeProduction = {
  active: number;
  perHour: number;
  perDay: number;
  perMonth: number;
  ratio: { value: number; unit: "hour" | "second" };
};

export function likeProduction(input: {
  active: number;
  perHour: number;
  perDay: number;
  perMonth: number;
  influencerThreshold?: number;
}): LikeProduction {
  return {
    active: Math.max(0, input.active),
    perHour: Math.max(0, input.perHour),
    perDay: Math.max(0, input.perDay),
    perMonth: Math.max(0, input.perMonth),
    ratio: displayLikeRatio(input.perHour, input.influencerThreshold),
  };
}
