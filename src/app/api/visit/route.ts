import { NextResponse, type NextRequest } from "next/server";
import { business } from "@/config";
import { db } from "@/lib/db";
import { localDay } from "@/lib/time";
import { shouldCount } from "@/lib/visits";

// Strona ireneuszgalant.pl wysyła tu jedno zgłoszenie na wizytę (sendBeacon). Zapisujemy tylko
// licznik dnia: bez cookies, adresu IP ani przeglądarki. Błędy tylko logujemy.
export async function POST(req: NextRequest) {
  if (shouldCount(req.headers.get("origin"), req.headers.get("user-agent"))) {
    const { error } = await db().rpc("count_site_visit", { p_day: localDay(new Date(), business.timezone) });
    if (error) console.error("Licznik odwiedzin:", error.message);
  }
  return new NextResponse(null, { status: 204 });
}
