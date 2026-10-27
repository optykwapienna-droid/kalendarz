import { NextResponse, type NextRequest } from "next/server";
import { business, services } from "@/config";
import { isAdmin } from "@/lib/auth";
import { busyBetween } from "@/lib/bookings";
import { PANEL_TIMES } from "@/lib/panelTimes";
import { addDays, isDay, localToUtc, parseHm } from "@/lib/time";

// Godziny z listy w panelu, które nachodzą na wizytę, blokadę lub wydarzenie w Kalendarzu Google.
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Brak dostępu" }, { status: 401 });
  const day = req.nextUrl.searchParams.get("day") ?? "";
  if (!isDay(day)) return NextResponse.json({ error: "Zły dzień" }, { status: 400 });
  const tz = business.timezone;
  const durationMs = services[0].durationMin * 60000;
  const busy = await busyBetween(localToUtc(day, 0, tz), localToUtc(addDays(day, 1), 0, tz));
  const taken = PANEL_TIMES.filter((t) => {
    const start = localToUtc(day, parseHm(t), tz).getTime();
    return busy.some((b) => b.start.getTime() < start + durationMs && b.end.getTime() > start);
  });
  return NextResponse.json({ taken }, { headers: { "Cache-Control": "no-store" } });
}
