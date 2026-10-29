// Gotowe wzory szablonów SMS. W panelu można je wczytać jednym przyciskiem: nadpisują treść
// szablonów o tych samych nazwach (brakujące dodają) i ustawiają domyślne do automatycznej wysyłki.
import type { SmsKind } from "./db";

export const SMS_DEFAULTS: { kind: SmsKind; name: string; body: string; isDefault?: boolean }[] = [
  {
    kind: "confirmation",
    name: "Potwierdzenie",
    isDefault: true,
    body: "Dzień dobry, potwierdzamy wizytę {data} o {godzina}, {salon}, {adres}.\nZmiana/odwołanie:\n{link}",
  },
  {
    kind: "reminder",
    name: "Przypomnienie",
    isDefault: true,
    body: "Dzień dobry, przypominamy o wizycie jutro o {godzina}, {salon}, {adres}.\nZmiana/odwołanie:\n{link}",
  },
  {
    kind: "reminder",
    name: "Przypomnienie krotkie",
    body: "Dzień dobry, jutro o {godzina} zapraszamy na badanie wzroku, {salon}, {adres}. Do zobaczenia!",
  },
  {
    kind: "thanks",
    name: "Podziekowanie z prosba o opinie",
    isDefault: true,
    body: "Dzień dobry, dziękujemy za wizytę w {salon}. Będzie nam miło, jeśli {pan} zostawi opinię w Google:\n{opinia}\nIreneusz Galant",
  },
  {
    kind: "thanks",
    name: "Podziekowanie",
    body: "Dzień dobry, dziękujemy za wizytę w {salon}. W razie pytań o okulary jesteśmy do dyspozycji.\nPozdrawiamy, Ireneusz Galant",
  },
  {
    kind: "other",
    name: "Okulary do odbioru",
    body: "Dzień dobry, {pana} okulary są gotowe do odbioru w {salon}, {adres}. Zapraszamy!",
  },
  {
    kind: "other",
    name: "Odwolanie wizyty przez gabinet",
    body: "Dzień dobry, z przykrością musimy odwołać {pana} wizytę {data} o {godzina}. Przepraszamy i prosimy o kontakt w sprawie nowego terminu: tel. {telefon}.\n{salon}",
  },
  {
    kind: "other",
    name: "Prosba o zmiane terminu",
    body: "Dzień dobry, musimy zmienić termin {pana} wizyty {data} o {godzina}. Przepraszamy! Nowy termin:\n{zmiana}\nPytania: tel. {telefon}",
  },
  {
    kind: "other",
    name: "Nowy termin wizyty",
    body: "Dzień dobry, wizyta została przeniesiona na {data} o {godzina}, {salon}, {adres}.\nZmiana/odwołanie:\n{link}",
  },
];
