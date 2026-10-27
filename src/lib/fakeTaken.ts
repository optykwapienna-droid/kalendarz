import { createHash } from "node:crypto";
import { booking, business, openingHours, type Weekday } from "@/config";
import { isHoliday } from "./holidays";
import { localToUtc, parseHm, weekday } from "./time";

/** Stała liczba z [0, 1) dla tekstu, żeby po odświeżeniu strony pokazać te same godziny. */
function score(text: string): number {
  return createHash("sha256").update(text).digest().readUInt32BE(0) / 2 ** 32;
}

/**
 * Kilka pozornie zajętych godzin w dniu otwarcia, wybranych spoza grafiku (nie nachodzą
 * na prawdziwe godziny przyjęć). Ten sam dzień zawsze daje te same godziny.
 */
export function fakeTaken(day: string, now: Date, durationMin: number, tz = business.timezone): Date[] {
  const [min, max] = booking.fakeTakenPerDay;
  const ranges = openingHours[weekday(day) as Weekday];
  if (max <= 0 || ranges.length === 0 || isHoliday(day)) return [];

  const open = ranges.map((r) => [parseHm(r.from), parseHm(r.to)]);
  const earliest = now.getTime() + booking.minNoticeHours * 3600000;
  const candidates: number[] = [];
  for (let m = parseHm(booking.fakeTakenHours.from); m <= parseHm(booking.fakeTakenHours.to); m += 30) {
    if (open.some(([a, b]) => m < b && m + durationMin > a)) continue;
    if (localToUtc(day, m, tz).getTime() < earliest) continue;
    candidates.push(m);
  }
  const count = Math.min(candidates.length, min + Math.floor(score(day) * (max - min + 1)));
  return candidates
    .sort((a, b) => score(`${day} ${a}`) - score(`${day} ${b}`))
    .slice(0, count)
    .sort((a, b) => a - b)
    .map((m) => localToUtc(day, m, tz));
}
