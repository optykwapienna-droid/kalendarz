-- Uruchom raz w Supabase: SQL Editor -> New query -> wklej -> Run.

create extension if not exists btree_gist;

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  service_id text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  first_name text not null,
  last_name text not null,
  phone text not null,
  answers jsonb not null default '{}'::jsonb,
  -- Rezerwacje dodane w panelu nie mają akceptacji z formularza
  privacy_accepted_at timestamptz,
  created_by text not null default 'patient' check (created_by in ('patient', 'panel')),
  source text,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'no_show')),
  cancel_token text not null unique,
  google_event_id text,
  confirmation_sent_at timestamptz,
  reminder_sent_at timestamptz,
  thanks_sent_at timestamptz,
  -- Zwrot w SMS-ach poprawiony w panelu (f = Pani, m = Pan); null = zgadujemy z imienia
  gender text check (gender in ('f', 'm')),
  created_at timestamptz not null default now(),
  -- Dwie potwierdzone wizyty nie mogą na siebie nachodzić, nawet przy jednoczesnej rezerwacji
  constraint bookings_no_overlap exclude using gist (
    tstzrange(starts_at, ends_at) with &&
  ) where (status = 'confirmed')
);

create index if not exists bookings_starts_at_idx on bookings (starts_at);

-- Blokady kalendarza: urlop, szkolenie, prywatne sprawy
create table if not exists blocks (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists blocks_starts_at_idx on blocks (starts_at);

-- Szablony SMS. Dla każdego rodzaju jeden może być domyślny (wysyłany automatycznie).
create table if not exists sms_templates (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('confirmation', 'reminder', 'thanks', 'other')),
  name text not null,
  body text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists sms_templates_one_default on sms_templates (kind) where is_default;

-- Historia wysłanych SMS-ów (widoczna w panelu, usuwana razem z rezerwacją)
create table if not exists sms_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  kind text not null,
  body text not null,
  error text,
  sent_at timestamptz not null default now()
);

create index if not exists sms_log_booking_idx on sms_log (booking_id);

insert into sms_templates (kind, name, body, is_default)
select * from (values
  ('confirmation', 'Potwierdzenie', 'Optyk Wapienna: potwierdzamy wizyte {data} o {godzina}, {adres}. Odwolanie: {link}', true),
  ('reminder', 'Przypomnienie', 'Optyk Wapienna: przypominamy o wizycie jutro o {godzina}, {adres}. Odwolanie: {link}', true),
  ('reminder', 'Przypomnienie krotkie', 'Optyk Wapienna: jutro o {godzina} badanie wzroku, {adres}. Do zobaczenia!', false),
  ('thanks', 'Podziekowanie', 'Dziekujemy za wizyte w Optyk Wapienna! W razie pytan o okulary jestesmy do dyspozycji. Pozdrawiamy, Ireneusz Galant', true),
  ('thanks', 'Podziekowanie z prosba o opinie', 'Dziekujemy za wizyte w Optyk Wapienna! Bedzie nam milo, jesli zostawisz opinie w Google: {opinia}', false),
  ('other', 'Odwolanie wizyty przez gabinet', 'Optyk Wapienna: niestety musimy odwolac wizyte {data} o {godzina}. Przepraszamy, prosimy o kontakt w sprawie nowego terminu: {telefon}', false),
  ('other', 'Okulary do odbioru', 'Optyk Wapienna: {imie}, Twoje okulary sa gotowe do odbioru. {adres}. Zapraszamy!', false)
) as t(kind, name, body, is_default)
where not exists (select 1 from sms_templates);

-- Dostęp wyłącznie z serwera aplikacji (klucz service_role). Bez polityk RLS
-- nikt z zewnątrz, także z kluczem publicznym, nie odczyta danych pacjentów.
alter table bookings enable row level security;
alter table blocks enable row level security;
alter table sms_templates enable row level security;
alter table sms_log enable row level security;

-- Dla istniejących baz
alter table bookings add column if not exists gender text check (gender in ('f', 'm'));

-- Niedokończone zapisy: dane z formularza, zanim pacjent kliknie „Rezerwuję wizytę”.
-- Usuwane po udanej rezerwacji z tym numerem albo po 7 dniach (cron).
create table if not exists booking_drafts (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  first_name text,
  last_name text,
  phone text not null,
  service_id text,
  starts_at timestamptz,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists booking_drafts_phone_idx on booking_drafts (phone);
alter table booking_drafts enable row level security;
