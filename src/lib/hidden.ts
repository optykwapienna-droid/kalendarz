import { createHash } from "node:crypto";
import { booking } from "@/config";
import { addDays } from "./time";

/** Stała liczba z [0, 1) dla danej godziny, żeby po odświeżeniu strony ukryte były te same terminy. */
function score(slot: Date): number {
  return createHash("sha256").update(slot.toISOString()).digest().readUInt32BE(0) / 2 ** 32;
}

/**
 * Wolne godziny pokazywane pacjentowi: od `hideFromDay` dnia w przód część z nich
 * udaje zajęte. W dniu z wolnymi terminami zawsze zostaje co najmniej jeden.
 */
export function visibleSlots(
  day: string,
  today: string,
  slots: Date[],
  share = booking.hiddenShare,
  fromDay = booking.hideFromDay,
): Date[] {
  if (share <= 0 || slots.length <= 1 || day < addDays(today, fromDay)) return slots;
  const shown = slots.filter((s) => score(s) >= share);
  if (shown.length > 0) return shown;
  return [slots.reduce((best, s) => (score(s) > score(best) ? s : best))];
}
