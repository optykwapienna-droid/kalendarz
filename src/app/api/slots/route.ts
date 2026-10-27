import { NextResponse, type NextRequest } from "next/server";
import { services } from "@/config";
import { availability } from "@/lib/bookings";
import { isDay } from "@/lib/time";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const serviceId = p.get("service") ?? services[0].id;
  const from = p.get("from");
  const days = Math.min(Math.max(Number(p.get("days") ?? 14) || 14, 1), 31);
  if (!isDay(from) || !services.some((s) => s.id === serviceId)) {
    return NextResponse.json({ error: "Niepoprawne parametry" }, { status: 400 });
  }
  const slots = await availability(serviceId, from, days);
  return NextResponse.json({ slots }, { headers: { "Cache-Control": "no-store" } });
}
