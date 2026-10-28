import { sendPush } from "./push";
import { db, type BookingRow, type SmsKind, type TemplateRow } from "./db";
import { sendSms } from "./smsGateway";
import { genderOf } from "./gender";
import { SMS_DEFAULTS } from "./smsDefaults";
import { business } from "@/config";
import { answersText, fullName } from "./bookings";
import { formatTime, formatWeekdayDate } from "./time";
import { normalizePhone } from "./validate";
import { renderSms } from "./smsText";

export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function visitUrl(b: BookingRow): string {
  return `${siteUrl()}/o/${b.cancel_token}`;
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
  await sendTemplate(b, tpl);
  return true;
}

/**
 * Wysyła SMS z szablonu o danej nazwie (np. „Odwolanie wizyty przez gabinet”). Gdy w bazie
 * nie ma takiego szablonu, bierze treść z wzorów domyślnych.
 */
export async function sendNamedSms(b: BookingRow, name: string): Promise<void> {
  const { data, error } = await db().from("sms_templates").select("*").eq("name", name).limit(1).maybeSingle();
  if (error) throw error;
  const tpl = (data as TemplateRow | null) ?? SMS_DEFAULTS.find((t) => t.name === name);
  if (!tpl) throw new Error(`Brak szablonu SMS „${name}”`);
  await sendTemplate(b, tpl);
}

async function sendTemplate(b: BookingRow, tpl: { kind: SmsKind; body: string }): Promise<void> {
  const text = renderSms(tpl.body, {
    firstName: b.first_name,
    lastName: b.last_name,
    start: new Date(b.starts_at),
    link: visitUrl(b),
    gender: genderOf(b),
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
}


const ADMIN_EVENTS = { new: "Nowa wizyta", moved: "Zmiana terminu", cancelled: "Odwołana wizyta" } as const;

/** Push i SMS do gabinetu o zmianie w wizytach dokonanej przez pacjenta. Błąd tylko logujemy. */
export async function notifyAdmin(event: keyof typeof ADMIN_EVENTS, b: BookingRow, oldStart?: string): Promise<void> {
  const tz = business.timezone;
  const when = (iso: string) => `${formatWeekdayDate(new Date(iso), tz)}, ${formatTime(new Date(iso), tz)}`;
  const text = [
    `${ADMIN_EVENTS[event]}: ${fullName(b)}`,
    oldStart ? `${when(oldStart)} → ${when(b.starts_at)}` : when(b.starts_at),
    `tel. +${b.phone}`,
    event === "new" ? answersText(b) : "",
  ]
    .filter(Boolean)
    .join("\n");
  const [title, ...rest] = text.split("\n");
  await sendPush(title, rest.slice(0, 2).join("\n"));
  const to = business.adminPhone && normalizePhone(business.adminPhone);
  if (!to) return;
  await sendSms(to, text).catch((e) => console.error("Błąd SMS do gabinetu:", e));
}
