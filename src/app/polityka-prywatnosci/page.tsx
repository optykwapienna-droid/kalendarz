import type { Metadata } from "next";
import { booking, business } from "@/config";

export const metadata: Metadata = { title: `Polityka prywatności | ${business.name}` };

// TODO: przed startem uzupełnić dane administratora (firma, NIP) i dać do przejrzenia prawnikowi.
export default function Privacy() {
  return (
    <section className="card">
      <h1 style={{ marginTop: 0 }}>Zasady przetwarzania danych</h1>
      <p>
        <strong>Administrator danych:</strong> {business.name}, {business.street}, {business.city}
        {business.email && <>, e-mail: {business.email}</>}
        {business.phone && <>, tel. {business.phone}</>}.
      </p>
      <p>
        <strong>Cel i podstawa:</strong> umówienie i obsługa wizyty (art. 6 ust. 1 lit. b RODO) oraz wysłanie
        SMS-ów z potwierdzeniem, przypomnieniem i podziękowaniem po wizycie (art. 6 ust. 1 lit. f RODO, nasz
        uzasadniony interes).
      </p>
      <p>
        <strong>Zakres danych:</strong> imię, nazwisko, numer telefonu, termin wizyty i nieobowiązkowe odpowiedzi na
        pytania przed wizytą. Formularz nie zbiera informacji o chorobach ani lekach.
      </p>
      <p>
        <strong>Odbiorcy:</strong> dostawcy usług technicznych działający na nasze zlecenie: hosting aplikacji i bazy
        danych (serwery w Unii Europejskiej), bramka SMS oraz Google (kalendarz gabinetu). Nie sprzedajemy ani nie udostępniamy
        danych w celach marketingowych.
      </p>
      <p>
        <strong>Okres przechowywania:</strong> dane rezerwacji usuwamy automatycznie {booking.retentionMonths} miesięcy
        po terminie wizyty. Dokumentacja z badania jest prowadzona osobno, zgodnie z przepisami.
      </p>
      <p>
        <strong>Twoje prawa:</strong> dostęp do danych, ich sprostowanie, usunięcie, ograniczenie przetwarzania, sprzeciw
        oraz skarga do Prezesa Urzędu Ochrony Danych Osobowych. Podanie danych jest dobrowolne, ale potrzebne do
        umówienia wizyty.
      </p>
    </section>
  );
}
