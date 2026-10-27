import { NextResponse, type NextRequest } from "next/server";
import { findByToken, rescheduleBooking } from "@/lib/bookings";
import { sendBookingSms } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.t === "string" ? body.t : "";
  const start = typeof body?.start === "string" ? new Date(body.start) : null;
  if (!start || Number.isNaN(start.getTime())) return NextResponse.json({ error: "Wybierz nowy termin." }, { status: 400 });

  const b = await findByToken(token);
  if (!b) return NextResponse.json({ error: "Nie znaleziono wizyty." }, { status: 404 });

  const result = await rescheduleBooking(b, start);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  // Nowy termin jest zapisany, błąd SMS tylko logujemy (widać go w panelu)
  await sendBookingSms(result.booking, "confirmation").catch((e) => console.error("Błąd SMS:", e));
  return NextResponse.json({ ok: true });
}
