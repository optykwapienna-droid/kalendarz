import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { normalizePhone } from "@/lib/validate";
import { sendVoucher, VOUCHERS, withdrawConsent, type VoucherId } from "@/lib/vouchers";

function back(req: NextRequest, msg: string) {
  return NextResponse.redirect(new URL(`/panel/vouchery?komunikat=${encodeURIComponent(msg)}`, req.url), 303);
}

// Wysyłka vouchera SMS-em (tylko za zgodą klienta) i wycofanie zgody.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/panel/login", req.url), 303);
  const f = await req.formData();
  const phone = normalizePhone(String(f.get("phone") ?? ""));
  if (!phone) return back(req, "Podaj poprawny numer telefonu.");

  if (f.get("action") === "withdraw") {
    await withdrawConsent(phone);
    return back(req, "Zgoda wycofana, ten numer nie dostanie już voucherów.");
  }

  const voucherId = String(f.get("voucher") ?? "") as VoucherId;
  if (!VOUCHERS.some((v) => v.id === voucherId)) return back(req, "Wybierz voucher.");
  if (f.get("consent") !== "on") return back(req, "Voucher można wysłać tylko za zgodą klienta.");
  const firstName = String(f.get("firstName") ?? "").trim().slice(0, 60);
  try {
    await sendVoucher(phone, firstName, voucherId);
  } catch (e) {
    console.error("Voucher:", e);
    return back(req, `Voucher nie został wysłany: ${e instanceof Error ? e.message : e}`);
  }
  return back(req, `Voucher wysłany na +${phone}.`);
}
