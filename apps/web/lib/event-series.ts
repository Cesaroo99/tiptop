import type { Messages } from "@tiptop/i18n";

export function recurrenceCaption(
  recurrence: string | null | undefined,
  world: Messages["world"],
): string | null {
  if (recurrence === "DAILY") return world.recursDaily;
  if (recurrence === "WEEKLY") return world.recursWeekly;
  if (recurrence === "MONTHLY") return world.recursMonthly;
  return null;
}
