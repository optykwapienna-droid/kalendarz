import { business } from "@/config";
import { db, type BookingRow, type SmsKind, type TemplateRow } from "./db";
import { renderSms, toGsm } from "./smsText";

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function visitUrl(b: BookingRow): string {
  return `${siteUrl()}/o/${b.cancel_token}`;
}

export async function sendSms(phone: string, message: string): Promise<void> {
  const token = process.env.SMSAPI_TOKEN;
  if (!token) {
    console.log(`[SMS pominięty, brak SMSAPI_TOKEN] ${phone}: ${message}`);
    return;
  }
  const res = await fetch("https://api.smsapi.pl/sms.do", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      to: phone,
      message: toGsm(message),
      from: process.env.SMS_SENDER ?? "Test",
      format: "json",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`SMSAPI: ${body.message ?? res.status}`);
}

export async function listTemplates(): Promise<TemplateRow[]> {
  const { data, error } = await db().from("sms_templates").select("*").order("kind").order("created_at");
  if (error) throw error;
  return data as TemplateRow[];
}

async function defaultTemplate(kind: SmsKind): Promise<TemplateRow | null> {
  const { data, error } = await db().from("sms_templates").select("*").eq("kind", kind).eq("is_default", true).maybeSingle();
  if (error) throw error;
  return (data as TemplateRow) ?? null;
}

async function templateById(id: string): Promise<TemplateRow | null> {
  const { data, error } = await db().from("sms_templates").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as TemplateRow) ?? null;
}

const sentColumn: Partial<Record<SmsKind, string>> = {
  confirmation: "confirmation_sent_at",
  reminder: "reminder_sent_at",
  thanks: "thanks_sent_at",
};

/**
 * Wysyła SMS do pacjenta z szablonu (domyślnego dla rodzaju albo wybranego w panelu)
 * i zapisuje go w historii. Zwraca false, gdy dla rodzaju nie ma szablonu domyślnego,
 * czyli automatyczna wysyłka jest wyłączona.
 */
export async function sendBookingSms(b: BookingRow, kind: SmsKind, templateId?: string): Promise<boolean> {
  const tpl = templateId ? await templateById(templateId) : await defaultTemplate(kind);
  if (!tpl) return false;
  const text = renderSms(tpl.body, {
    firstName: b.first_name,
    lastName: b.last_name,
    start: new Date(b.starts_at),
    link: visitUrl(b),
  });
  let error: string | null = null;
  try {
    await sendSms(b.phone, text);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  await db().from("sms_log").insert({ booking_id: b.id, kind: tpl.kind, body: text, error });
  if (error) throw new Error(error);
  const col = sentColumn[tpl.kind];
  if (col) await db().from("bookings").update({ [col]: new Date().toISOString() }).eq("id", b.id);
  return true;
}

