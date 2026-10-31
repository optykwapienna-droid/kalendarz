import { addDays, weekday } from "./time";

// Licznik odwiedzin strony ireneuszgalant.pl. Bez cookies i bez danych osobowych:
// w bazie jest tylko liczba wejść w danym dniu.

export type VisitDay = { day: string; visits: number };

export type WeekVisits = {
  week: string; // poniedziałek, RRRR-MM-DD
  visits: number;
  bookings: number; // rezerwacje z linku ?zrodlo=strona
  sources: Record<string, number>; // wszystkie rezerwacje z tygodnia wg źródła
};

export type BookingDay = { day: string; source: string; fromSite: boolean };

/** Strony, z których przyjmujemy zliczenia. */
export const SITE_ORIGINS = ["https://ireneuszgalant.pl", "https://www.ireneuszgalant.pl"];

const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|curl|wget|python|java\//i;

/** Wejście do zliczenia: ze strony gabinetu i nie od robota. */
export function shouldCount(origin: string | null, userAgent: string | null): boolean {
  if (!origin || !SITE_ORIGINS.includes(origin)) return false;
  return !!userAgent && !BOT.test(userAgent);
}

export function weekStart(day: string): string {
  return addDays(day, -((weekday(day) + 6) % 7));
}

/** Odwiedziny w ostatnich `days` dniach, łącznie z dzisiejszym. */
export function visitsSince(rows: VisitDay[], today: string, days: number): number {
  const from = addDays(today, -(days - 1));
  return rows.filter((r) => r.day >= from && r.day <= today).reduce((s, r) => s + r.visits, 0);
}

/** Ostatnie `weeks` tygodni (od bieżącego): odwiedziny, rezerwacje ze strony i wszystkie rezerwacje wg źródła. */
export function weeklyVisits(rows: VisitDay[], bookings: BookingDay[], today: string, weeks: number): WeekVisits[] {
  const current = weekStart(today);
  const list: WeekVisits[] = [];
  const byWeek = new Map<string, WeekVisits>();
  for (let i = 0; i < weeks; i++) {
    const w = { week: addDays(current, -7 * i), visits: 0, bookings: 0, sources: {} as Record<string, number> };
    list.push(w);
    byWeek.set(w.week, w);
  }
  for (const r of rows) {
    const w = byWeek.get(weekStart(r.day));
    if (w) w.visits += r.visits;
  }
  for (const b of bookings) {
    const w = byWeek.get(weekStart(b.day));
    if (!w) continue;
    if (b.fromSite) w.bookings++;
    w.sources[b.source] = (w.sources[b.source] ?? 0) + 1;
  }
  return list;
}
