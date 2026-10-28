import { business } from "@/config";
import { db } from "./db";
import { guessGender } from "./gender";
import { siteUrl } from "./sms";
import { sendSms } from "./smsGateway";
import { renderSms } from "./smsText";

// Vouchery wysyłane SMS-em klientom, którzy kupili okulary i zgodzili się na oferty.
export const VOUCHERS = [
  { id: "20", label: "Voucher -20% na soczewki okularowe", path: "/voucher-20" },
  { id: "50", label: "Voucher -50% na soczewki recepturowe", path: "/voucher-50" },
] as const;

export type VoucherId = (typeof VOUCHERS)[number]["id"];

export const VOUCHER_SMS =
  "Dzień dobry,\ndziękujemy za zakup okularów w {salon}! 🎁\n\nMamy dla {pana} {voucher}:\n{link}\n\nDo zobaczenia! 👓";

/** Klient, który zgodził się na SMS-y z ofertami (zgoda zapisana przy wysyłce vouchera). */
export type ConsentRow = {
  phone: string;
  first_name: string | null;
  given_at: string;
  last_voucher: string | null;
  last_sent_at: string | null;
};

export function voucherText(voucherId: VoucherId, firstName: string): string {
  const v = VOUCHERS.find((x) => x.id === voucherId)!;
  return renderSms(VOUCHER_SMS.replace("{voucher}", v.label.replace(/^Voucher/, "voucher")), {
    firstName,
    lastName: "",
    start: new Date(),
    link: `${siteUrl()}${v.path}`,
    gender: firstName ? guessGender(firstName) : null,
  });
}

/** Link otwierający WhatsApp z gotową wiadomością do danego numeru (48XXXXXXXXX). */
export function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/** Zapisuje zgodę klienta na oferty i informację o wysłanym voucherze. */
export async function saveConsent(phone: string, firstName: string, voucherId: VoucherId): Promise<void> {
  const { error } = await db()
    .from("marketing_consents")
    .upsert(
      { phone, first_name: firstName || null, last_voucher: voucherId, last_sent_at: new Date().toISOString() },
      { onConflict: "phone", ignoreDuplicates: false },
    );
  if (error) throw error;
}

/** Zapisuje zgodę i wysyła voucher SMS-em. Rzuca błąd, gdy SMS nie wyszedł (zgoda zostaje zapisana). */
export async function sendVoucher(phone: string, firstName: string, voucherId: VoucherId): Promise<void> {
  await saveConsent(phone, firstName, voucherId);
  const text = voucherText(voucherId, firstName);
  await sendLoggedSms(phone, text);
}

/** SMS bez powiązanej wizyty, zapisany w historii SMS-ów. */
export async function sendLoggedSms(phone: string, text: string): Promise<void> {
  let err: string | null = null;
  try {
    await sendSms(phone, text);
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }
  await db().from("sms_log").insert({ booking_id: null, kind: "other", body: text, error: err });
  if (err) throw new Error(err);
}

/** Zaproszenie do zapisów: link do strony rezerwacji (źródło „zaproszenie” w Statystykach). */
export const INVITE_SMS =
  "Dzień dobry,\nzapraszamy na badanie wzroku w {salon} 👓\n\nWybierz dogodny termin online:\n📅 {link}\n\nDo zobaczenia!";

export function inviteText(firstName: string): string {
  return renderSms(INVITE_SMS, {
    firstName,
    lastName: "",
    start: new Date(),
    link: `${siteUrl()}/?zrodlo=zaproszenie`,
    gender: firstName ? guessGender(firstName) : null,
  });
}


export async function listConsents(): Promise<ConsentRow[]> {
  const { data, error } = await db().from("marketing_consents").select("*").order("last_sent_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data as ConsentRow[];
}

export async function withdrawConsent(phone: string): Promise<void> {
  const { error } = await db().from("marketing_consents").delete().eq("phone", phone);
  if (error) throw error;
}

