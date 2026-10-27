import { randomBytes } from "node:crypto";
import { booking, business, questions, services } from "@/config";
import { db, type BlockRow, type BookingRow, type SmsLogRow } from "./db";
import { createEvent, deleteEvent, googleBusy, listAppEvents } from "./google";
import { slotsForDay, type Busy } from "./slots";
import { planSync } from "./syncPlan";
import { addDays, localDay, localToUtc } from "./time";
import type { Validated } from "./validate";

const tz = business.timezone;

export function fullName(b: Pick<BookingRow, "first_name" | "last_name">): string {
  return `${b.first_name} ${b.last_name}`;
}

export function serviceName(id: string): string {
  return services.find((s) => s.id === id)?.name ?? id;
}

export function answersText(b: BookingRow): string {
  return questions
    .filter((q) => b.answers[q.id] !== undefined)
    .map((q) => {
      const v = b.answers[q.id];
      return `${q.label}: ${Array.isArray(v) ? v.join(", ") : v}`;
    })
    .join("\n");
}

export async function busyBetween(from: Date, to: Date): Promise<Busy[]> {
  const [b, k, g] = await Promise.all([
    db()
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("status", "confirmed")
      .lt("starts_at", to.toISOString())
      .gt("ends_at", from.toISOString()),
    db().from("blocks").select("starts_at, ends_at").lt("starts_at", to.toISOString()).gt("ends_at", from.toISOString()),
    // Gdy Google nie odpowiada, pokazujemy terminy według samej bazy, zamiast blokować zapisy
    googleBusy(from, to).catch((e) => {
      console.error("Google freeBusy nieudane:", e);
      return [] as Busy[];
    }),
  ]);
  if (b.error) throw b.error;
  if (k.error) throw k.error;
  return [...b.data, ...k.data].map((r) => ({ start: new Date(r.starts_at), end: new Date(r.ends_at) })).concat(g);
}

/** Wolne terminy dla kolejnych `days` dni, zaczynając od `fromDay`. */
export async function availability(serviceId: string, fromDay: string, days: number, now = new Date()) {
  const service = services.find((s) => s.id === serviceId);
  if (!service) throw new Error("Nieznana usługa");
  const today = localDay(now, tz);
  if (fromDay < today) fromDay = today;
  const toDay = addDays(fromDay, days);
  const busy = await busyBetween(localToUtc(fromDay, 0, tz), localToUtc(toDay, 0, tz));
  const result: Record<string, string[]> = {};
  for (let d = fromDay; d < toDay; d = addDays(d, 1)) {
    result[d] = slotsForDay(d, { now, durationMin: service.durationMin, busy }).map((s) => s.toISOString());
  }
  return result;
}

export type CreateResult = { ok: true; booking: BookingRow } | { ok: false; error: string; status: number };

const TAKEN = "Ten termin jest już zajęty. Wybierz inny.";

/**
 * Zapisuje wizytę. Pacjent może wybrać tylko wolny termin w godzinach otwarcia;
 * z panelu (`fromPanel`) można wpisać dowolną godzinę, byle nie nachodziła na inną wizytę.
 */
export async function createBooking(input: Validated, opts: { fromPanel?: boolean; now?: Date } = {}): Promise<CreateResult> {
  const now = opts.now ?? new Date();
  const service = services.find((s) => s.id === input.serviceId)!;
  const end = new Date(input.start.getTime() + service.durationMin * 60000);

  if (!opts.fromPanel) {
    const day = localDay(input.start, tz);
    const busy = await busyBetween(localToUtc(day, 0, tz), localToUtc(addDays(day, 1), 0, tz));
    const free = slotsForDay(day, { now, durationMin: service.durationMin, busy });
    if (!free.some((s) => s.getTime() === input.start.getTime())) return { ok: false, status: 409, error: TAKEN };
  }

  const { data, error } = await db()
    .from("bookings")
    .insert({
      service_id: service.id,
      starts_at: input.start.toISOString(),
      ends_at: end.toISOString(),
      first_name: input.firstName,
      last_name: input.lastName,
      phone: input.phone,
      answers: input.answers,
      privacy_accepted_at: opts.fromPanel ? null : now.toISOString(),
      created_by: opts.fromPanel ? "panel" : "patient",
      source: input.source ?? null,
      cancel_token: randomBytes(12).toString("base64url"),
    })
    .select()
    .single();

  if (error) {
    // 23P01: naruszenie ograniczenia bookings_no_overlap, ktoś zajął termin w tej samej chwili
    if (error.code === "23P01") return { ok: false, status: 409, error: TAKEN };
    throw error;
  }
  const row = data as BookingRow;

  try {
    const eventId = await createEvent({
      bookingId: row.id,
      start: input.start,
      end,
      summary: `${fullName(row)} – ${service.name}`,
      description: [`Telefon: +${row.phone}`, answersText(row), row.source ? `Źródło: ${row.source}` : ""]
        .filter(Boolean)
        .join("\n"),
    });
    if (eventId) {
      await db().from("bookings").update({ google_event_id: eventId }).eq("id", row.id);
      row.google_event_id = eventId;
    }
  } catch (e) {
    console.error("Nie udało się dodać wizyty do Kalendarza Google:", e);
  }
  return { ok: true, booking: row };
}

export async function findByToken(token: string): Promise<BookingRow | null> {
  if (!token || token.length > 100) return null;
  const { data, error } = await db().from("bookings").select("*").eq("cancel_token", token).maybeSingle();
  if (error) throw error;
  return (data as BookingRow) ?? null;
}

export async function findById(id: string): Promise<BookingRow | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const { data, error } = await db().from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as BookingRow) ?? null;
}

export function canPatientCancel(b: BookingRow, now = new Date()): boolean {
  return b.status === "confirmed" && new Date(b.starts_at).getTime() - now.getTime() > booking.cancelUntilHours * 3600000;
}

export async function setStatus(b: BookingRow, status: BookingRow["status"]): Promise<void> {
  const { error } = await db().from("bookings").update({ status }).eq("id", b.id);
  if (error) throw error;
  if (status === "cancelled") {
    await deleteEvent(b.google_event_id).catch((e) => console.error("Nie udało się usunąć wydarzenia Google:", e));
  }
}

export async function listBookings(from: Date, to: Date): Promise<BookingRow[]> {
  const { data, error } = await db()
    .from("bookings")
    .select("*")
    .gte("starts_at", from.toISOString())
    .lt("starts_at", to.toISOString())
    .order("starts_at");
  if (error) throw error;
  return data as BookingRow[];
}

export async function listBlocks(from: Date): Promise<BlockRow[]> {
  const { data, error } = await db().from("blocks").select("*").gte("ends_at", from.toISOString()).order("starts_at");
  if (error) throw error;
  return data as BlockRow[];
}

export async function smsHistory(ids: string[]): Promise<Record<string, SmsLogRow[]>> {
  if (ids.length === 0) return {};
  const { data, error } = await db().from("sms_log").select("*").in("booking_id", ids).order("sent_at");
  if (error) throw error;
  const out: Record<string, SmsLogRow[]> = {};
  for (const r of data as SmsLogRow[]) (out[r.booking_id] ??= []).push(r);
  return out;
}

/** Przenosi do bazy zmiany zrobione w Kalendarzu Google (usunięcie lub przesunięcie wizyty). */
export async function syncFromGoogle(now = new Date()): Promise<{ cancelled: number; moved: number }> {
  const from = new Date(now.getTime() - 86400000);
  const to = new Date(now.getTime() + (booking.maxDaysAhead + 30) * 86400000);
  const events = await listAppEvents(from, to);
  if (!events) return { cancelled: 0, moved: 0 };
  const plan = planSync(await listBookings(from, to), events);
  for (const id of plan.cancel) {
    await db().from("bookings").update({ status: "cancelled" }).eq("id", id);
  }
  let moved = 0;
  for (const m of plan.move) {
    const { error } = await db()
      .from("bookings")
      .update({ starts_at: m.start.toISOString(), ends_at: m.end.toISOString(), reminder_sent_at: null })
      .eq("id", m.id);
    if (error) console.error(`Nie udało się przenieść wizyty ${m.id}:`, error.message);
    else moved++;
  }
  return { cancelled: plan.cancel.length, moved };
}
