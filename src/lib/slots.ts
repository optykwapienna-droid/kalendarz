import { booking, business, openingHours, type Weekday } from "@/config";
import { isHoliday } from "./holidays";
import { addDays, localDay, localToUtc, parseHm, weekday } from "./time";

export type Busy = { start: Date; end: Date };

export type SlotOptions = {
  now: Date;
  durationMin: number;
  busy: Busy[];
  tz?: string;
  hours?: typeof openingHours;
  stepMin?: number;
  minNoticeHours?: number;
  maxDaysAhead?: number;
};

/** Wolne godziny rozpoczęcia wizyty w danym dniu, jako chwile w UTC. */
export function slotsForDay(day: string, opts: SlotOptions): Date[] {
  const tz = opts.tz ?? business.timezone;
  const hours = opts.hours ?? openingHours;
  const step = opts.stepMin ?? booking.slotStepMin;
  const minNotice = (opts.minNoticeHours ?? booking.minNoticeHours) * 3600000;
  const lastDay = addDays(localDay(opts.now, tz), opts.maxDaysAhead ?? booking.maxDaysAhead);

  if (day > lastDay || isHoliday(day)) return [];

  const result: Date[] = [];
  for (const range of hours[weekday(day) as Weekday]) {
    const from = parseHm(range.from);
    const to = parseHm(range.to);
    for (let m = from; m + opts.durationMin <= to; m += step) {
      const start = localToUtc(day, m, tz);
      const end = new Date(start.getTime() + opts.durationMin * 60000);
      if (start.getTime() < opts.now.getTime() + minNotice) continue;
      if (opts.busy.some((b) => b.start < end && b.end > start)) continue;
      result.push(start);
    }
  }
  return result;
}
