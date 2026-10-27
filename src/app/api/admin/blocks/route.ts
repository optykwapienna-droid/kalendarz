import { NextResponse, type NextRequest } from "next/server";
import { business } from "@/config";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDays, isDay, localToUtc, parseHm } from "@/lib/time";

const hm = (s: string) => /^\d{2}:\d{2}$/.test(s);

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/panel/login", req.url), 303);
  const form = await req.formData();
  const action = String(form.get("action") ?? "");

  if (action === "delete") {
    const id = String(form.get("id") ?? "");
    if (/^[0-9a-f-]{36}$/.test(id)) await db().from("blocks").delete().eq("id", id);
  } else if (action === "add") {
    const from = String(form.get("from") ?? "");
    const to = String(form.get("to") ?? "") || from;
    const fromTime = String(form.get("fromTime") ?? "");
    const toTime = String(form.get("toTime") ?? "");
    if (isDay(from) && isDay(to) && to >= from) {
      const tz = business.timezone;
      // Bez godzin blokujemy całe dni
      const start = localToUtc(from, hm(fromTime) ? parseHm(fromTime) : 0, tz);
      const end = hm(toTime) ? localToUtc(to, parseHm(toTime), tz) : localToUtc(addDays(to, 1), 0, tz);
      if (end > start) {
        const note = String(form.get("note") ?? "").slice(0, 200) || null;
        await db().from("blocks").insert({ starts_at: start.toISOString(), ends_at: end.toISOString(), note });
      }
    }
  }
  return NextResponse.redirect(new URL("/panel", req.url), 303);
}
