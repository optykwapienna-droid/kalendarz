import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { findById } from "@/lib/bookings";
import { sendBookingSms } from "@/lib/sms";

// Ręczna wysyłka SMS do pacjenta z szablonu wybranego z menu.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/panel/login", req.url), 303);
  const f = await req.formData();
  const b = await findById(String(f.get("id") ?? ""));
  const templateId = String(f.get("templateId") ?? "");
  let msg = "SMS wysłany.";
  if (!b || !/^[0-9a-f-]{36}$/.test(templateId)) msg = "Wybierz szablon.";
  else {
    try {
      await sendBookingSms(b, "other", templateId);
    } catch (e) {
      msg = `SMS nie został wysłany: ${e instanceof Error ? e.message : e}`;
    }
  }
  return NextResponse.redirect(new URL(`/panel?komunikat=${encodeURIComponent(msg)}`, req.url), 303);
}
