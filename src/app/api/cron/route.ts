import { NextResponse, type NextRequest } from "next/server";
import { booking, business } from "@/config";
import { safeEqual } from "@/lib/auth";
import { syncFromGoogle } from "@/lib/bookings";
import { db, type BookingRow } from "@/lib/db";
import { sendBookingSms } from "@/lib/sms";
import { addDays, localDay, localToUtc } from "@/lib/time";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Uruchamiane raz dziennie wieczorem przez Vercel Cron (vercel.json):
// 1) zmiany z Kalendarza Google, 2) przypomnienia o jutrzejszych wizytach,
// 3) podziękowania za dzisiejsze wizyty, 4) usuwanie starych danych.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || !safeEqual(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ error: "Brak dostępu" }, { status: 401 });
  }

  const tz = business.timezone;
  const now = new Date();
  const today = localDay(now, tz);
  const tomorrow = addDays(today, 1);

  const sync = await syncFromGoogle(now).catch((e) => {
    console.error("Synchronizacja z Google nieudana:", e);
    return null;
  });

  const reminders = await db()
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("starts_at", localToUtc(tomorrow, 0, tz).toISOString())
    .lt("starts_at", localToUtc(addDays(tomorrow, 1), 0, tz).toISOString());
  if (reminders.error) throw reminders.error;

  // Odwołane i oznaczone „nie przyszedł” nie dostają podziękowania
  const thanks = await db()
    .from("bookings")
    .select("*")
    .eq("status", "confirmed")
    .is("thanks_sent_at", null)
    .gte("starts_at", localToUtc(today, 0, tz).toISOString())
    .lte("ends_at", now.toISOString());
  if (thanks.error) throw thanks.error;

  const result = { sync, reminders: 0, thanks: 0, failed: [] as string[], deleted: 0 };
  for (const [rows, kind] of [
    [reminders.data, "reminder"],
    [thanks.data, "thanks"],
  ] as const) {
    for (const b of rows as BookingRow[]) {
      try {
        if (await sendBookingSms(b, kind)) result[kind === "reminder" ? "reminders" : "thanks"]++;
      } catch (e) {
        console.error(`SMS ${kind} dla ${b.id} nieudany:`, e);
        result.failed.push(b.id);
      }
    }
  }

  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - booking.retentionMonths);
  const del = await db().from("bookings").delete({ count: "exact" }).lt("starts_at", cutoff.toISOString());
  if (del.error) throw del.error;
  await db().from("blocks").delete().lt("ends_at", cutoff.toISOString());
  result.deleted = del.count ?? 0;

  return NextResponse.json(result);
}
