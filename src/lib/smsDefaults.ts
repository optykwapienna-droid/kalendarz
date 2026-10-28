// Gotowe wzory szablonów SMS. W panelu można je wczytać jednym przyciskiem: nadpisują treść
// szablonów o tych samych nazwach (brakujące dodają) i ustawiają domyślne do automatycznej wysyłki.
import type { SmsKind } from "./db";

export const SMS_DEFAULTS: { kind: SmsKind; name: string; body: string; isDefault?: boolean }[] = [
  {
    kind: "confirmation",
    name: "Potwierdzenie",
    isDefault: true,
    body: "Dzień dobry,\npotwierdzamy {pana} wizytę ✅\n\n📅 {dzien}, godz. {godzina}\n📍 {salon}, {adres}\n\n🔄 Zmiana rezerwacji:\n{link}\n\nDo zobaczenia! 👓",
  },
  {
    kind: "reminder",
    name: "Przypomnienie",
    isDefault: true,
    body: "Dzień dobry,\nprzypominamy o jutrzejszej wizycie 👓\n\n📅 {dzien}, godz. {godzina}\n📍 {salon}, {adres}\n\n🔄 Zmiana rezerwacji:\n{link}",
  },
  {
    kind: "reminder",
    name: "Przypomnienie krotkie",
    body: "Dzień dobry,\njutro o godz. {godzina} zapraszamy na badanie wzroku.\n📍 {salon}, {adres}\nDo zobaczenia!",
  },
  {
    kind: "thanks",
    name: "Podziekowanie z prosba o opinie",
    isDefault: true,
    body: "Dzień dobry,\ndziękujemy za wizytę w {salon} 🙏\n\nBędzie nam bardzo miło, jeśli {pan} zostawi opinię w Google ⭐\n{opinia}\n\nIreneusz Galant",
  },
  {
    kind: "thanks",
    name: "Podziekowanie",
    body: "Dzień dobry,\ndziękujemy za wizytę w {salon}. W razie pytań o okulary jesteśmy do dyspozycji.\n\nPozdrawiamy serdecznie\nIreneusz Galant",
  },
  {
    kind: "other",
    name: "Okulary do odbioru",
    body: "Dzień dobry,\n{pana} okulary są gotowe do odbioru 👓\n\n📍 {salon}, {adres}\nZapraszamy!",
  },
  {
    kind: "other",
    name: "Odwolanie wizyty przez gabinet",
    body: "Dzień dobry,\nz przykrością musimy odwołać {pana} wizytę {dzien}, godz. {godzina}. Przepraszamy i prosimy o kontakt w sprawie nowego terminu:\n📞 {telefon}\n\n{salon}",
  },
  {
    kind: "other",
    name: "Prosba o zmiane terminu",
    body: "Dzień dobry,\nniestety musimy zmienić termin {pana} wizyty ({dzien}, godz. {godzina}). Przepraszamy! Prosimy wybrać nowy, dogodny termin:\n🔄 {zmiana}\n\nW razie pytań: 📞 {telefon}\n{salon}",
  },
  {
    kind: "other",
    name: "Nowy termin wizyty",
    body: "Dzień dobry,\nzgodnie z ustaleniami {pana} wizyta została przeniesiona ✅\n\n📅 {dzien}, godz. {godzina}\n📍 {salon}, {adres}\n\n🔄 Zmiana rezerwacji:\n{link}",
  },
];
