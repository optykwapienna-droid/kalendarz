// Czysta logika SMS (bez bazy i sieci), żeby dało się ją testować.
import { business } from "@/config";
import { type Gender, honorifics } from "./gender";
import { formatShortDate, formatTime } from "./time";

export const SMS_KINDS = {
  confirmation: "Potwierdzenie rezerwacji",
  reminder: "Przypomnienie dzień przed",
  thanks: "Podziękowanie po wizycie",
  other: "Inne (wysyłane ręcznie)",
} as const;

export const PLACEHOLDERS: Record<string, string> = {
  "{imie}": "imię pacjenta",
  "{nazwisko}": "nazwisko pacjenta",
  "{powitanie}": "„Szanowna Pani” / „Szanowny Panie” (gdy płeć nieznana: „Dzień dobry”)",
  "{pan}": "Pani / Pan, np. „czy {pan} potwierdza”",
  "{pana}": "Pani / Pana, np. „zapraszamy {pana}”",
  "{panu}": "Pani / Panu, np. „dziękujemy {panu}”",
  "{data}": "data wizyty, np. 28.10",
  "{godzina}": "godzina wizyty, np. 10:00",
  "{adres}": "adres salonu",
  "{telefon}": "telefon salonu",
  "{link}": "link do szczegółów i odwołania wizyty",
  "{opinia}": "link do wystawienia opinii w Google",
};

/** SMS bez polskich znaków mieści 160 zamiast 70 znaków, więc jest tańszy. */
export function toGsm(s: string): string {
  return s
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[„”“]/g, '"')
    .replace(/[–—]/g, "-");
}

/** Liczba części SMS (po zamianie na znaki bez ogonków). */
export function smsParts(text: string): number {
  const n = toGsm(text).length;
  return n <= 160 ? 1 : Math.ceil(n / 153);
}

export type SmsContext = {
  firstName: string;
  lastName: string;
  start: Date;
  link: string;
  gender?: Gender | null;
};

export function renderSms(body: string, c: SmsContext): string {
  const tz = business.timezone;
  const values: Record<string, string> = {
    "{imie}": c.firstName,
    "{nazwisko}": c.lastName,
    "{data}": formatShortDate(c.start, tz),
    "{godzina}": formatTime(c.start, tz),
    "{adres}": business.street,
    "{telefon}": business.phone,
    "{link}": c.link,
    "{opinia}": business.googleReviewUrl,
    ...honorifics(c.gender ?? null),
  };
  // Zachowujemy podział na linie z szablonu, porządkujemy tylko spacje i puste linie
  return toGsm(body.replace(/\{[a-z]+\}/g, (m) => values[m] ?? m))
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
