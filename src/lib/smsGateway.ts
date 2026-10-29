// Wysyłka SMS. Domyślnie z telefonu gabinetu przez aplikację SMS Gate na Androidzie
// (https://sms-gate.app): serwer zleca wysyłkę, a SMS wychodzi z numeru i abonamentu
// telefonu. Alternatywnie bramka SMSAPI.pl. Bez konfiguracji SMS-y są tylko logowane.

export type SmsProvider = "smsgate" | "smsapi" | "none";

export function smsProvider(): SmsProvider {
  if (process.env.SMSGATE_USER && process.env.SMSGATE_PASSWORD) return "smsgate";
  if (process.env.SMSAPI_TOKEN) return "smsapi";
  return "none";
}

async function viaSmsGate(phone: string, text: string): Promise<void> {
  const base = (process.env.SMSGATE_URL || "https://api.sms-gate.app").replace(/\/$/, "");
  const auth = Buffer.from(`${process.env.SMSGATE_USER}:${process.env.SMSGATE_PASSWORD}`).toString("base64");
  const res = await fetch(`${base}/3rdparty/v1/messages`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      textMessage: { text },
      phoneNumbers: [`+${phone}`],
      // SMS niewysłany w ciągu 12 godz. (np. wyłączony telefon) przepada, żeby
      // przypomnienie nie przyszło już po wizycie
      ttl: 12 * 3600,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SMS Gate: ${res.status} ${body.slice(0, 200)}`);
  }
}

async function viaSmsApi(phone: string, text: string): Promise<void> {
  const res = await fetch("https://api.smsapi.pl/sms.do", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SMSAPI_TOKEN}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ to: phone, message: text, from: process.env.SMS_SENDER ?? "Test", format: "json" }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(`SMSAPI: ${body.message ?? res.status}`);
}

/** `phone` w formacie 48XXXXXXXXX (jak zapisany w bazie). */
export async function sendSms(phone: string, text: string): Promise<void> {
  const provider = smsProvider();
  if (provider === "smsgate") return viaSmsGate(phone, text);
  if (provider === "smsapi") return viaSmsApi(phone, text);
  console.log(`[SMS pominięty, brak konfiguracji] ${phone}: ${text}`);
}
