// Dni ustawowo wolne od pracy w Polsce. W te dni nie pokazujemy terminów.

function easterSunday(year: number): Date {
  // Algorytm Meeusa/Jonesa/Butchera
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function shift(date: Date, days: number): string {
  return new Date(date.getTime() + days * 86400000).toISOString().slice(0, 10);
}

export function polishHolidays(year: number): Set<string> {
  const fixed = ["01-01", "01-06", "05-01", "05-03", "08-15", "11-01", "11-11", "12-25", "12-26"];
  // Wigilia jest dniem wolnym od 2025 r.
  if (year >= 2025) fixed.push("12-24");
  const easter = easterSunday(year);
  return new Set([
    ...fixed.map((md) => `${year}-${md}`),
    shift(easter, 0), // Wielkanoc
    shift(easter, 1), // Poniedziałek Wielkanocny
    shift(easter, 49), // Zielone Świątki
    shift(easter, 60), // Boże Ciało
  ]);
}

export function isHoliday(day: string): boolean {
  return polishHolidays(Number(day.slice(0, 4))).has(day);
}
