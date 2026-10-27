// Kalendarz Google przez konto usługi (service account). Gabinet udostępnia
// swój kalendarz adresowi konta usługi z uprawnieniem „Wprowadzanie zmian w wydarzeniach”.
// Bez ustawionych zmiennych GOOGLE_* wszystkie funkcje nic nie robią.
import { createSign } from "node:crypto";
import type { Busy } from "./slots";

const API = "https://www.googleapis.com/calendar/v3";
export const APP_TAG = "optyk-rezerwacje";

type Config = { email: string; key: string; calendarId: string };

function config(): Config | null {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  return email && key && calendarId ? { email, key, calendarId } : null;
}

export function googleEnabled(): boolean {
  return config() !== null;
}

let cached: { token: string; exp: number } | null = null;

async function accessToken(c: Config): Promise<string> {
  if (cached && cached.exp > Date.now() + 60000) return cached.token;
  const now = Math.floor(Date.now() / 1000);
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss: c.email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(c.key).toString("base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Google token: ${body.error_description ?? res.status}`);
  cached = { token: body.access_token, exp: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

async function call(c: Config, method: string, path: string, body?: object): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${await accessToken(c)}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (method === "DELETE" && (res.status === 404 || res.status === 410)) return null;
  if (!res.ok) throw new Error(`Google ${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const cal = (c: Config) => `/calendars/${encodeURIComponent(c.calendarId)}`;

export type CalendarEvent = {
  bookingId: string;
  start: Date;
  end: Date;
  summary: string;
  description: string;
};

/** Tworzy wydarzenie i zwraca jego id albo null, gdy Google nie jest skonfigurowany. */
export async function createEvent(e: CalendarEvent): Promise<string | null> {
  const c = config();
  if (!c) return null;
  const ev = await call(c, "POST", `${cal(c)}/events`, {
    summary: e.summary,
    description: e.description,
    start: { dateTime: e.start.toISOString() },
    end: { dateTime: e.end.toISOString() },
    extendedProperties: { private: { app: APP_TAG, bookingId: e.bookingId } },
  });
  return ev.id;
}

export async function deleteEvent(eventId: string | null): Promise<void> {
  const c = config();
  if (!c || !eventId) return;
  await call(c, "DELETE", `${cal(c)}/events/${encodeURIComponent(eventId)}`);
}

/** Zajęte przedziały z Kalendarza Google (prywatne sprawy, wizyty wpisane ręcznie). */
export async function googleBusy(from: Date, to: Date): Promise<Busy[]> {
  const c = config();
  if (!c) return [];
  const r = await call(c, "POST", "/freeBusy", {
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    items: [{ id: c.calendarId }],
  });
  const entry = r.calendars?.[c.calendarId];
  if (entry?.errors?.length) throw new Error(`Google freeBusy: ${JSON.stringify(entry.errors)}`);
  return (entry?.busy ?? []).map((b: { start: string; end: string }) => ({ start: new Date(b.start), end: new Date(b.end) }));
}

export type AppEvent = { eventId: string; bookingId: string; cancelled: boolean; start: Date | null; end: Date | null };

/** Wydarzenia utworzone przez aplikację, także usunięte w Google (żeby odwołać wizytę). */
export async function listAppEvents(from: Date, to: Date): Promise<AppEvent[] | null> {
  const c = config();
  if (!c) return null;
  const out: AppEvent[] = [];
  let pageToken: string | undefined;
  do {
    const q = new URLSearchParams({
      privateExtendedProperty: `app=${APP_TAG}`,
      timeMin: from.toISOString(),
      timeMax: to.toISOString(),
      showDeleted: "true",
      singleEvents: "true",
      maxResults: "2500",
      ...(pageToken ? { pageToken } : {}),
    });
    const r = await call(c, "GET", `${cal(c)}/events?${q}`);
    for (const ev of r.items ?? []) {
      const bookingId = ev.extendedProperties?.private?.bookingId;
      if (!bookingId) continue;
      out.push({
        eventId: ev.id,
        bookingId,
        cancelled: ev.status === "cancelled",
        start: ev.start?.dateTime ? new Date(ev.start.dateTime) : null,
        end: ev.end?.dateTime ? new Date(ev.end.dateTime) : null,
      });
    }
    pageToken = r.nextPageToken;
  } while (pageToken);
  return out;
}
