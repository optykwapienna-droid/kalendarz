import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { normalizePhone } from "@/lib/validate";
import { inviteText, sendLoggedSms, whatsappUrl } from "@/lib/vouchers";

function back(req: NextRequest, msg: string) {
  return NextResponse.redirect(new URL(`/panel?komunikat=${encodeURIComponent(msg)}`, req.url), 303);
}

// Link do zapisów dla pacjenta: SMS-em z bramki albo przez WhatsApp (otwiera czat z gotową wiadomością).
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/panel/login", req.url), 303);
  const f = await req.formData();
  const phone = normalizePhone(String(f.get("phone") ?? ""));
  if (!phone) return back(req, "Podaj poprawny numer telefonu.");
  const text = inviteText(String(f.get("firstName") ?? "").trim().slice(0, 60));
  if (f.get("channel") === "whatsapp") return NextResponse.redirect(whatsappUrl(phone, text), 303);
  try {
    await sendLoggedSms(phone, text);
  } catch (e) {
    return back(req, `SMS nie został wysłany: ${e instanceof Error ? e.message : e}`);
  }
  return back(req, `Link do zapisów wysłany SMS-em na +${phone}.`);
}
