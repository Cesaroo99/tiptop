export type TodayRec = {
  id: string;
  eventId: string;
  title: string;
  startsAt: string;
  city: string;
  zone: string | null;
  priceXaf: number;
  currency: string;
  interestedCount: number;
  score: number;
  category: string | null;
  reasonKey: string;
  reasons: string[];
};

export type ExperiencePlanView = {
  id: string;
  title: string;
  surprise: boolean;
  totalCostXaf: number;
  status: string;
  steps: Array<{
    order: number;
    startsAt: string;
    title: string;
    category: string;
    eventId: string | null;
    costXaf: number;
    travelMin: number;
    revealed: boolean;
    bookable: boolean;
    hint: boolean;
  }>;
};

export type MatchPerson = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  category: string;
  available: boolean;
  distanceLabel: string | null;
  score: number;
};

import type { Messages } from "@tiptop/i18n";

export function reasonLabel(key: string, intel: Messages["intel"]): string {
  if (key === "habit_category") return intel.reasonHabit;
  if (key === "budget_fit") return intel.reasonBudget;
  if (key === "starts_soon") return intel.reasonSoon;
  if (key === "preferred_hours") return intel.reasonHours;
  if (key === "nearby") return intel.reasonNearby;
  if (key === "social_proof") return intel.reasonSocial;
  return intel.seeWhy;
}
