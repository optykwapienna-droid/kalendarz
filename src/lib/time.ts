// Proste operacje na datach w strefie gabinetu, bez zewnętrznych bibliotek.
// Daty dnia przekazujemy jako "YYYY-MM-DD", godziny jako minuty od północy.

export function tzOffsetMinutes(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const m = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(+m.year, +m.month - 1, +m.day, +m.hour, +m.minute, +m.second);
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

/** Lokalny czas w strefie `tz` (dzień + minuty od północy) zamieniony na chwilę w UTC. */
export function localToUtc(day: string, minutes: number, tz: string): Date {
  const [y, mo, d] = day.split("-").map(Number);
  const guess = Date.UTC(y, mo - 1, d, 0, minutes);
  const off1 = tzOffsetMinutes(new Date(guess), tz);
  let t = guess - off1 * 60000;
  const off2 = tzOffsetMinutes(new Date(t), tz);
  if (off2 !== off1) t = guess - off2 * 60000;
  return new Date(t);
}

/** Dzień kalendarzowy ("YYYY-MM-DD") danej chwili w strefie `tz`. */
export function localDay(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

export function addDays(day: string, n: number): string {
  const [y, mo, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d + n)).toISOString().slice(0, 10);
}

export function weekday(day: string): number {
  const [y, mo, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
}

export function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function isDay(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + "T00:00:00Z"));
}

export function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("pl-PL", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(date);
}

export function formatDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("pl-PL", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(date);
}

export function formatShortDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("pl-PL", { timeZone: tz, day: "2-digit", month: "2-digit" }).format(date);
}
