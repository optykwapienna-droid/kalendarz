import { NextResponse, type NextRequest } from "next/server";
import { business, services } from "@/config";
import { isAdmin } from "@/lib/auth";
import { createBooking, findById, setStatus } from "@/lib/bookings";
import { sendBookingSms } from "@/lib/sms";
import { isDay, localToUtc, parseHm } from "@/lib/time";
import { validateBooking } from "@/lib/validate";

function back(req: NextRequest, msg?: string) {
  return NextResponse.redirect(new URL(msg ? `/panel?komunikat=${encodeURIComponent(msg)}` : "/panel", req.url), 303);
}

// Akcje na wizytach z panelu: dodanie (np. po telefonie), odwołanie, „nie przyszedł”, przywrócenie.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/panel/login", req.url), 303);
  const f = await req.formData();
  const action = String(f.get("action") ?? "");

  if (action === "add") {
    const day = String(f.get("day") ?? "");
    const time = String(f.get("time") ?? "");
    if (!isDay(day) || !/^\d{2}:\d{2}$/.test(time)) return back(req, "Podaj datę i godzinę wizyty.");
    const v = validateBooking(
      {
        serviceId: String(f.get("serviceId") ?? services[0].id),
        start: localToUtc(day, parseHm(time), business.timezone).toISOString(),
        firstName: f.get("firstName"),
        lastName: f.get("lastName"),
        phone: f.get("phone"),
        answers: { uwagi: String(f.get("note") ?? "") },
        source: "telefon",
      },
      { fromPanel: true },
    );
    if (!v.ok) return back(req, v.error);
    const r = await createBooking(v.value, { fromPanel: true });
    if (!r.ok) return back(req, r.error);
    if (f.get("sms") === "on") {
      try {
        await sendBookingSms(r.booking, "confirmation");
      } catch {
        return back(req, "Wizyta zapisana, ale SMS nie został wysłany. Sprawdź historię SMS.");
      }
    }
    return back(req, "Wizyta zapisana.");
  }

  const b = await findById(String(f.get("id") ?? ""));
  if (!b) return back(req);
  if (action === "cancel") await setStatus(b, "cancelled");
  if (action === "no_show") await setStatus(b, "no_show");
  if (action === "showed") await setStatus(b, "confirmed");
  return back(req);
}
