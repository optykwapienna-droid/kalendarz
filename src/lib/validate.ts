import { questions, services } from "@/config";

export type BookingInput = {
  serviceId: string;
  start: string; // ISO w UTC
  firstName: string;
  lastName: string;
  phone: string;
  answers: Record<string, string | string[]>;
  privacyAccepted: boolean;
  source?: string;
  website?: string; // pułapka na boty, prawdziwy pacjent zostawia puste
};

export type Validated = Omit<BookingInput, "website" | "privacyAccepted" | "start"> & { start: Date };

/** Normalizuje polski numer do formatu 48XXXXXXXXX. Zwraca null, gdy numer jest niepoprawny. */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^\d{9}$/.test(digits)) digits = "48" + digits;
  return /^\d{10,15}$/.test(digits) ? digits : null;
}

const nameOk = (s: string) => s.length >= 2 && s.length <= 60;

/**
 * Sprawdza dane z formularza. Z panelu (`fromPanel`) nie wymagamy akceptacji zasad
 * ani odpowiedzi na pytania, bo wizytę wpisuje gabinet, np. po rozmowie telefonicznej.
 */
export function validateBooking(
  body: unknown,
  opts: { fromPanel?: boolean } = {},
): { ok: true; value: Validated } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Niepoprawne dane." };
  const b = body as Partial<BookingInput>;

  if (b.website) return { ok: false, error: "Niepoprawne dane." };

  const service = services.find((s) => s.id === b.serviceId);
  if (!service) return { ok: false, error: "Wybierz usługę." };

  const start = new Date(String(b.start));
  if (Number.isNaN(start.getTime())) return { ok: false, error: "Wybierz termin." };

  const firstName = String(b.firstName ?? "").trim();
  if (!nameOk(firstName)) return { ok: false, error: "Podaj imię." };
  const lastName = String(b.lastName ?? "").trim();
  if (!nameOk(lastName)) return { ok: false, error: "Podaj nazwisko." };

  const phone = normalizePhone(String(b.phone ?? ""));
  if (!phone) return { ok: false, error: "Podaj poprawny numer telefonu." };

  if (!opts.fromPanel && b.privacyAccepted !== true) {
    return { ok: false, error: "Zaakceptuj zasady przetwarzania danych." };
  }

  const raw = b.answers && typeof b.answers === "object" ? b.answers : {};
  const answers: Record<string, string | string[]> = {};
  for (const q of questions) {
    const v = (raw as Record<string, unknown>)[q.id];
    if (q.type === "multi") {
      const list = Array.isArray(v) ? v.filter((x): x is string => q.options.includes(x)) : [];
      if (q.required && !opts.fromPanel && list.length === 0) return { ok: false, error: `Odpowiedz na pytanie: ${q.label}` };
      if (list.length) answers[q.id] = list;
    } else if (q.type === "select") {
      const s = typeof v === "string" && q.options.includes(v) ? v : "";
      if (q.required && !opts.fromPanel && !s) return { ok: false, error: `Odpowiedz na pytanie: ${q.label}` };
      if (s) answers[q.id] = s;
    } else {
      const s = typeof v === "string" ? v.trim().slice(0, 500) : "";
      if (q.required && !opts.fromPanel && !s) return { ok: false, error: `Odpowiedz na pytanie: ${q.label}` };
      if (s) answers[q.id] = s;
    }
  }

  const source = typeof b.source === "string" ? b.source.replace(/[^\w-]/g, "").slice(0, 30) || undefined : undefined;

  return {
    ok: true,
    value: { serviceId: service.id, start, firstName, lastName, phone, answers, source },
  };
}
