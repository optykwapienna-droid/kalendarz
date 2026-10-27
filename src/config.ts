// Wszystkie ustawienia gabinetu w jednym miejscu. Zmiana godzin, usług lub
// pytań w ankiecie nie wymaga zmian w innych plikach.

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = niedziela

export type Service = {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price?: string;
  // Dopisek do ceny, np. promocja
  priceNote?: string;
};

export type Question =
  | { id: string; type: "select"; label: string; options: string[]; required?: boolean }
  | { id: string; type: "multi"; label: string; options: string[]; required?: boolean }
  | { id: string; type: "text"; label: string; placeholder?: string; required?: boolean };

export const business = {
  name: "Optyk Wapienna",
  person: "Ireneusz Galant, optometrysta",
  street: "ul. Wapienna 20",
  postalCode: "", // TODO: uzupełnić kod pocztowy
  city: "Wrocław",
  phone: "502 144 394",
  email: "", // TODO: uzupełnić adres e-mail salonu
  // Link „Napisz opinię” z Profilu Firmy w Google (Udostępnij profil -> Poproś o opinie)
  googleReviewUrl: "https://g.page/r/CcMK2j77FxMfEBM/review",
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Optyk+Wapienna+Wapienna+20+Wroc%C5%82aw",
  timezone: "Europe/Warsaw",
};

export const services: Service[] = [
  {
    id: "badanie",
    name: "Badanie wzroku – dobór okularów",
    description:
      "Komputerowe i subiektywne badanie ostrości wzroku wykonywane przez optometrystę, z doborem korekcji okularowej.",
    durationMin: 60,
    price: "200 zł",
    priceNote: "1 zł przy zakupie kompletnej pary okularów",
  },
];

// Godziny przyjęć: w każdym przedziale wizyty zaczynają się co `slotStepMin` minut
// i muszą się w nim zmieścić. Przedział o długości jednej wizyty daje jedną stałą godzinę.
export const openingHours: Record<Weekday, { from: string; to: string }[]> = {
  0: [],
  // pon–śr: 10:30, 15:00, 16:00, 17:00
  1: [{ from: "10:30", to: "11:30" }, { from: "15:00", to: "18:00" }],
  2: [{ from: "10:30", to: "11:30" }, { from: "15:00", to: "18:00" }],
  3: [{ from: "10:30", to: "11:30" }, { from: "15:00", to: "18:00" }],
  // czwartek nieczynne
  4: [],
  // piątek: 10:30, 15:00, 16:00
  5: [{ from: "10:30", to: "11:30" }, { from: "15:00", to: "17:00" }],
  // sobota: 11:00, 12:00, 13:00
  6: [{ from: "11:00", to: "14:00" }],
};

export const booking = {
  // Co ile minut zaczynają się wizyty
  slotStepMin: 60,
  // Najwcześniej ile godzin przed wizytą można się zapisać
  minNoticeHours: 2,
  // Na ile dni do przodu pokazujemy terminy
  maxDaysAhead: 45,
  // Do ilu godzin przed wizytą pacjent może ją sam odwołać
  cancelUntilHours: 2,
  // Po ilu miesiącach od wizyty dane rezerwacji są usuwane (RODO)
  retentionMonths: 12,
  // Pozornie zajęte godziny spoza grafiku, pokazywane pacjentom obok prawdziwych terminów,
  // żeby kalendarz wyglądał na wypełniony. [min, max] na dzień; [0, 0] wyłącza.
  fakeTakenPerDay: [2, 3] as [number, number],
  // Z jakiego zakresu godzin je losujemy (co pół godziny)
  fakeTakenHours: { from: "09:00", to: "18:30" },
};

// Pytania przed wizytą, wszystkie nieobowiązkowe. Celowo bez pytań o choroby
// i leki (dane o zdrowiu zbieramy dopiero w gabinecie). Pusta lista = brak ankiety.
export const questions: Question[] = [
  {
    id: "cel",
    type: "select",
    label: "Cel wizyty",
    options: [
      "Okulary do dali",
      "Okulary do czytania / bliży",
      "Okulary progresywne",
      "Okulary do komputera",
      "Kontrola wzroku",
      "Mam receptę, tylko wybór oprawki",
      "Nie wiem, proszę o poradę",
    ],
  },
  {
    id: "korekcja",
    type: "select",
    label: "Czy nosisz okulary lub soczewki?",
    options: ["Nie", "Okulary", "Soczewki kontaktowe", "Okulary i soczewki"],
  },
  {
    id: "ostatnie_badanie",
    type: "select",
    label: "Kiedy było ostatnie badanie wzroku?",
    options: ["Mniej niż rok temu", "1–2 lata temu", "Ponad 2 lata temu", "Nigdy / nie pamiętam"],
  },
  {
    id: "dolegliwosci",
    type: "multi",
    label: "Czy coś Ci dokucza?",
    options: ["Nieostre widzenie z daleka", "Nieostre widzenie z bliska", "Zmęczenie oczu", "Bóle głowy"],
  },
  {
    id: "uwagi",
    type: "text",
    label: "Uwagi dla optometrysty",
    placeholder: "Np. pracuję dużo przy komputerze",
  },
];

export const visitTips = [
  "Zabierz obecne okulary (również te do czytania lub przeciwsłoneczne korekcyjne).",
  "Jeśli masz ostatnią receptę lub wynik badania, weź go ze sobą.",
  "Jeśli nosisz soczewki kontaktowe, zabierz informację o ich parametrach (np. opakowanie).",
];
