# Rezerwacje – Optyk Wapienna

Prosty system zapisów na badanie wzroku. Pacjent podaje tylko imię, nazwisko i telefon. Wszystkie wiadomości idą SMS-em, a wizyty są widoczne w Kalendarzu Google gabinetu.

## Co jest w środku

- **Strona rezerwacji** (`/`): wybór dnia i godziny, imię, nazwisko, telefon, nieobowiązkowa ankieta. Dane strukturalne `Optician` dla Google.
- **Strona wizyty** (`/o/<kod>`): link z SMS-a; szczegóły wizyty i odwołanie przez pacjenta (najpóźniej 2 godz. przed).
- **Panel** (`/panel`):
  - dodawanie wizyt umówionych przez telefon (bez e-maila),
  - lista wizyt z odpowiedziami z ankiety i historią SMS-ów,
  - menu „Wyślij SMS…” z wyborem szablonu przy każdej wizycie,
  - odwołanie, oznaczenie „Nie przyszedł” (wtedy bez podziękowania),
  - blokady (urlop, przerwa).
- **Szablony SMS** (`/panel/sms`): edycja szablonów i wybór z menu, który szablon wychodzi automatycznie jako potwierdzenie, przypomnienie i podziękowanie (albo „Nie wysyłaj”). Podgląd długości i liczby SMS-ów.
- **SMS-y automatyczne z telefonu gabinetu** (aplikacja SMS Gate na Androidzie, w ramach abonamentu): potwierdzenie od razu po rezerwacji, przypomnienie wieczorem dzień przed, podziękowanie wieczorem w dniu wizyty. Pacjent widzi Twój numer i może odpisać lub oddzwonić. Bez polskich znaków, żeby mieściły się w 1 SMS. Zamiast telefonu można użyć bramki SMSAPI.pl.
- **Kalendarz Google, w obie strony**:
  - nowa wizyta pojawia się w Twoim kalendarzu (imię, nazwisko, telefon, ankieta),
  - Twoje wydarzenia w Google (prywatne sprawy, urlop, wizyty wpisane ręcznie) blokują terminy na stronie,
  - usunięcie wizyty w Google odwołuje ją w systemie, a przesunięcie zmienia jej termin (przy otwarciu panelu i codziennie wieczorem),
  - odwołanie w systemie usuwa wydarzenie z Google.
- **RODO**: dane w UE, brak pytań o zdrowie, automatyczne usuwanie rezerwacji po 12 mies., polityka prywatności.
- Święta ustawowe są wyłączone z kalendarza automatycznie.

Godziny otwarcia, usługi, pytania ankiety i dane gabinetu zmieniasz w jednym pliku: [`src/config.ts`](src/config.ts).

## Uruchomienie (ok. 45 minut)

1. **Supabase** (baza danych, darmowy plan): załóż konto na supabase.com, utwórz projekt w regionie **Central EU (Frankfurt)**. W *SQL Editor* wklej i uruchom [`supabase/schema.sql`](supabase/schema.sql); doda też przykładowe szablony SMS. W *Project Settings → API* skopiuj *Project URL* i klucz *service_role*.
2. **Telefon do SMS-ów (Android)**:
   1. Zainstaluj aplikację **SMS Gateway for Android** (sms-gate.app, autor capcom6 / Aleksandr Soloshenko). Oficjalnie pobiera się ją jako plik APK z [GitHub Releases](https://github.com/capcom6/android-sms-gateway/releases): na telefonie otwórz stronę, pobierz najnowszy plik `.apk` i zezwól przeglądarce na instalowanie aplikacji. Inne aplikacje o podobnych nazwach w Google Play nie będą działać. Po instalacji zezwól aplikacji na wysyłanie SMS-ów.
   2. W ustawieniach aplikacji włącz **Cloud server**, a na ekranie głównym przełącz ją na **Online**. Na zakładce *Home* pojawi się login i hasło: wpisz je jako `SMSGATE_USER` i `SMSGATE_PASSWORD`.
   3. W ustawieniach Androida wyłącz **optymalizację baterii** dla SMS Gate, żeby system jej nie usypiał.
   4. Telefon musi być włączony, naładowany i mieć internet (najlepiej Wi-Fi w salonie). SMS niewysłany w ciągu 12 godz. przepada, a błąd widać w historii SMS w panelu.
   5. Najlepiej osobny, tani telefon z kartą bez limitu SMS. Sprawdź regulamin abonamentu: część operatorów zabrania automatycznej wysyłki.

   Zamiast telefonu możesz użyć **SMSAPI.pl** (ok. 0,10–0,17 zł netto za SMS): token OAuth jako `SMSAPI_TOKEN`, zarejestrowane pole nadawcy jako `SMS_SENDER`. Używane tylko, gdy SMS Gate nie jest ustawiony.
3. **Kalendarz Google**:
   1. Wejdź na console.cloud.google.com, utwórz projekt i włącz **Google Calendar API**.
   2. *IAM i administracja → Konta usługi → Utwórz konto usługi*. Potem *Klucze → Dodaj klucz → JSON*. Z pobranego pliku: `client_email` to `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `private_key` to `GOOGLE_PRIVATE_KEY`.
   3. W Kalendarzu Google: *Ustawienia kalendarza → Udostępnij określonym osobom → Dodaj* adres `client_email` z uprawnieniem **„Wprowadzanie zmian w wydarzeniach”**. *Identyfikator kalendarza* (dla głównego to Twój adres Gmail) wpisz jako `GOOGLE_CALENDAR_ID`.
4. **Vercel** (hosting, darmowy plan): zaloguj się przez GitHub, *Add New → Project*, wybierz to repozytorium. W *Environment Variables* wpisz zmienne z [`.env.example`](.env.example). Losowe sekrety wygenerujesz poleceniem `openssl rand -base64 32`.
5. **Domena**: w Vercel *Settings → Domains* dodaj np. `rezerwacje.optykwapienna.pl` i ustaw rekord DNS u rejestratora. Ustaw `SITE_URL` na ten adres.
6. **Zadanie wieczorne** (`vercel.json`, 17:00 UTC, czyli 18:00 zimą i 19:00 latem): przypomnienia, podziękowania, synchronizacja z Google, usuwanie starych danych. Wymaga `CRON_SECRET`.

### Podpięcie do Google i ZnanyLekarz

- **Profil Firmy w Google** → *Edytuj profil* → *Linki do rezerwacji*: `https://<twoja-domena>/?zrodlo=google`. Pojawi się przycisk „Umów wizytę”.
- **ZnanyLekarz**: jeśli Twój pakiet pozwala dodać stronę WWW, użyj `https://<twoja-domena>/?zrodlo=znanylekarz`.
- Link do opinii Google (`googleReviewUrl` w `src/config.ts`) jest używany w szablonie SMS z prośbą o opinię.

## Praca lokalna

```bash
npm install
cp .env.example .env.local   # uzupełnij
npm run dev                  # http://localhost:3000
npm test                     # testy terminów, świąt, walidacji, SMS i synchronizacji z Google
```

## Przed startem

- [ ] Uzupełnić telefon, kod pocztowy i link do opinii Google w `src/config.ts`.
- [ ] Uzupełnić dane administratora (firma, NIP) w polityce prywatności i dać ją do przejrzenia.
- [ ] Zaakceptować umowy powierzenia (DPA) w Supabase, Vercel, SMS Gate (lub SMSAPI) i Google.
- [ ] Zrobić próbną rezerwację, sprawdzić SMS i wydarzenie w Kalendarzu Google, odwołać.
