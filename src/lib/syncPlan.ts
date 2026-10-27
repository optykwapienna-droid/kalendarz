import type { AppEvent } from "./google";

type Booked = { id: string; starts_at: string; ends_at: string; status: string; google_event_id: string | null };

export type SyncPlan = {
  cancel: string[];
  move: { id: string; start: Date; end: Date }[];
};

/**
 * Porównuje wizyty z wydarzeniami w Kalendarzu Google: wydarzenie usunięte w Google
 * odwołuje wizytę, przesunięte w Google zmienia jej termin.
 */
export function planSync(bookings: Booked[], events: AppEvent[]): SyncPlan {
  const byEvent = new Map(events.map((e) => [e.eventId, e]));
  const plan: SyncPlan = { cancel: [], move: [] };
  for (const b of bookings) {
    if (b.status !== "confirmed" || !b.google_event_id) continue;
    const ev = byEvent.get(b.google_event_id);
    if (!ev || ev.bookingId !== b.id) continue;
    if (ev.cancelled) {
      plan.cancel.push(b.id);
    } else if (
      ev.start &&
      ev.end &&
      (ev.start.getTime() !== new Date(b.starts_at).getTime() || ev.end.getTime() !== new Date(b.ends_at).getTime())
    ) {
      plan.move.push({ id: b.id, start: ev.start, end: ev.end });
    }
  }
  return plan;
}
