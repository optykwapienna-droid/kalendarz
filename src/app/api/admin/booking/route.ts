import { NextResponse, type NextRequest } from "next/server";
import { business, services } from "@/config";
import { isAdmin } from "@/lib/auth";
import { adminMoveBooking, createBooking, findById, setStatus } from "@/lib/bookings";
import { db } from "@/lib/db";
import { sendBookingSms, sendNamedSms } from "@/lib/sms";
import { isDay, localToUtc, parseHm } from "@/lib/time";
import { validateBooking } from "@/lib/validate";

function back(req: NextRequest, msg?: string, to = "/panel") {
  const url = new URL(to, req.url);
  if (msg) url.searchParams.set("komunikat", msg);
  return NextResponse.redirect(url, 303);
}

/** Strona panelu, na którą wracamy po akcji (np. kalendarz z wybranym dniem). */
function backPath(f: FormData): string {
  const p = String(f.get("back") ?? "");
  return /^\/panel(\/[a-z]+)?(\?[\w=&-]*)?$/.test(p) ? p : "/panel";
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

  const to = backPath(f);
  const b = await findById(String(f.get("id") ?? ""));
  if (!b) return back(req, undefined, to);
  if (action === "gender") {
    const g = String(f.get("gender") ?? "");
    await db().from("bookings").update({ gender: g === "f" || g === "m" ? g : null }).eq("id", b.id);
    return back(req, "Zwrot w SMS-ach zapisany.", to);
  }
  if (action === "cancel") {
    await setStatus(b, "cancelled");
    if (f.get("sms") === "on") {
      try {
        await sendNamedSms(b, "Odwolanie wizyty przez gabinet");
      } catch {
        return back(req, "Wizyta odwołana, ale SMS nie został wysłany. Sprawdź historię SMS.", to);
      }
      return back(req, "Wizyta odwołana, pacjent dostał SMS.", to);
    }
    return back(req, "Wizyta odwołana.", to);
  }
  if (action === "propose") {
    try {
      await sendNamedSms(b, "Prosba o zmiane terminu");
    } catch {
      return back(req, "SMS nie został wysłany. Sprawdź historię SMS.", to);
    }
    return back(req, "Wysłano pacjentowi SMS z prośbą o wybór nowego terminu. Wizyta zostaje, dopóki jej nie przeniesie.", to);
  }
  if (action === "move") {
    const day = String(f.get("day") ?? "");
    const time = String(f.get("time") ?? "");
    if (!isDay(day) || !/^\d{2}:\d{2}$/.test(time)) return back(req, "Podaj nowy dzień i godzinę.", to);
    const r = await adminMoveBooking(b, localToUtc(day, parseHm(time), business.timezone));
    if (!r.ok) return back(req, r.error, to);
    const newTo = `/panel/kalendarz?m=${day.slice(0, 7)}&d=${day}`;
    if (f.get("sms") === "on") {
      try {
        await sendNamedSms(r.booking, "Nowy termin wizyty");
      } catch {
        return back(req, "Wizyta przeniesiona, ale SMS nie został wysłany. Sprawdź historię SMS.", newTo);
      }
      return back(req, `Wizyta przeniesiona na ${day.split("-").reverse().join(".")}, godz. ${time}. Pacjent dostał SMS.`, newTo);
    }
    return back(req, `Wizyta przeniesiona na ${day.split("-").reverse().join(".")}, godz. ${time}.`, newTo);
  }
  if (action === "no_show") await setStatus(b, "no_show");
  if (action === "showed") await setStatus(b, "confirmed");
  return back(req, undefined, to);
}
