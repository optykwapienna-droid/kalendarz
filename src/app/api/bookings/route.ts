import { NextResponse, type NextRequest } from "next/server";
import { createBooking } from "@/lib/bookings";
import { sendBookingSms } from "@/lib/sms";
import { validateBooking } from "@/lib/validate";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const v = validateBooking(body);
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });

  const result = await createBooking(v.value);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  // Rezerwacja jest już zapisana, więc błąd wysyłki SMS tylko logujemy (widać go w panelu)
  await sendBookingSms(result.booking, "confirmation").catch((e) => console.error("Błąd SMS:", e));

  return NextResponse.json({ id: result.booking.id, start: result.booking.starts_at, token: result.booking.cancel_token });
}
