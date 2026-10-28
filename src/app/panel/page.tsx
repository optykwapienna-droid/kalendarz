import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { business } from "@/config";
import { isAdmin } from "@/lib/auth";
import type { BookingRow, SmsLogRow, TemplateRow } from "@/lib/db";
import { answersText, fullName, listBlocks, listBookings, serviceName, smsHistory, syncFromGoogle } from "@/lib/bookings";
import { guessGender } from "@/lib/gender";
import { googleEnabled } from "@/lib/google";
import { listTemplates, siteUrl } from "@/lib/sms";
import { SMS_KINDS } from "@/lib/smsText";
import { formatDate, formatTime, isDay, localDay } from "@/lib/time";
import DayTimeFields from "./DayTimeFields";
import Nav from "./Nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Panel gabinetu", robots: { index: false } };

const tz = business.timezone;

function dt(iso: string) {
  const d = new Date(iso);
  return `${formatDate(d, tz)}, ${formatTime(d, tz)}`;
}

const STATUS: Record<BookingRow["status"], string> = {
  confirmed: "",
  cancelled: "odwołana",
  no_show: "nie przyszedł",
};

function SmsMenu({ b, templates }: { b: BookingRow; templates: TemplateRow[] }) {
  return (
    <form method="post" action="/api/admin/sms" className="sms-menu">
      <input type="hidden" name="id" value={b.id} />
      <select name="templateId" required defaultValue="" aria-label="Szablon SMS">
        <option value="" disabled>
          Wyślij SMS…
        </option>
        {(Object.keys(SMS_KINDS) as (keyof typeof SMS_KINDS)[]).map((k) => {
          const list = templates.filter((t) => t.kind === k);
          return list.length ? (
            <optgroup key={k} label={SMS_KINDS[k]}>
              {list.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          ) : null;
        })}
      </select>
      <button className="btn secondary small">Wyślij</button>
    </form>
  );
}

function History({ log }: { log?: SmsLogRow[] }) {
  if (!log?.length) return null;
  return (
    <details className="small muted" style={{ marginTop: 4 }}>
      <summary>SMS-y ({log.length})</summary>
      {log.map((l) => (
        <div key={l.id} style={{ marginTop: 4 }}>
          {formatDate(new Date(l.sent_at), tz)} {formatTime(new Date(l.sent_at), tz)}: {l.body}
          {l.error && <span style={{ color: "var(--danger)" }}> (błąd: {l.error})</span>}
        </div>
      ))}
    </details>
  );
}

function Action({ b, action, label, danger }: { b: BookingRow; action: string; label: string; danger?: boolean }) {
  return (
    <form method="post" action="/api/admin/booking">
      <input type="hidden" name="id" value={b.id} />
      <input type="hidden" name="action" value={action} />
      <button className={`btn small ${danger ? "danger" : "secondary"}`}>{label}</button>
    </form>
  );
}

function GenderMenu({ b }: { b: BookingRow }) {
  const guess = guessGender(b.first_name);
  const auto = guess === "f" ? "Pani" : guess === "m" ? "Pan" : "Dzień dobry";
  return (
    <form method="post" action="/api/admin/booking" className="sms-menu">
      <input type="hidden" name="id" value={b.id} />
      <input type="hidden" name="action" value="gender" />
      <select name="gender" defaultValue={b.gender ?? ""} aria-label="Zwrot w SMS">
        <option value="">Zwrot: {auto} (auto)</option>
        <option value="f">Zwrot: Pani</option>
        <option value="m">Zwrot: Pan</option>
      </select>
      <button className="btn secondary small">Zmień</button>
    </form>
  );
}

function Row({ b, templates, log, past }: { b: BookingRow; templates: TemplateRow[]; log?: SmsLogRow[]; past?: boolean }) {
  return (
    <tr className={b.status !== "confirmed" ? "cancelled" : ""}>
      <td style={{ whiteSpace: "nowrap" }}>
        <strong>{dt(b.starts_at)}</strong>
        <br />
        <span className="small muted">{serviceName(b.service_id)}</span>
        {STATUS[b.status] && <div className="small">{STATUS[b.status]}</div>}
      </td>
      <td>
        <strong>{fullName(b)}</strong> · <a href={`tel:+${b.phone}`}>+{b.phone}</a>
        <div className="small muted" style={{ whiteSpace: "pre-line", marginTop: 4 }}>
          {answersText(b)}
          {b.source && `\nŹródło: ${b.source}`}
        </div>
        <History log={log} />
      </td>
      <td>
        <div className="actions">
          <SmsMenu b={b} templates={templates} />
          <GenderMenu b={b} />
          <a className="btn secondary small" href={`/panel/vouchery?tel=${b.phone}&imie=${encodeURIComponent(b.first_name)}`}>
            Wyślij voucher
          </a>
          {b.status === "confirmed" && !past && <Action b={b} action="cancel" label="Odwołaj" danger />}
          {b.status === "confirmed" && past && <Action b={b} action="no_show" label="Nie przyszedł" />}
          {b.status === "no_show" && <Action b={b} action="showed" label="Jednak był" />}
        </div>
      </td>
    </tr>
  );
}

export default async function Panel({ searchParams }: { searchParams: Promise<{ komunikat?: string; dzien?: string }> }) {
  if (!(await isAdmin())) redirect("/panel/login");
  const { komunikat, dzien } = await searchParams;

  const now = new Date();
  const syncError = await syncFromGoogle(now).then(
    () => null,
    (e) => (console.error("Synchronizacja z Google nieudana:", e), `Nie udało się pobrać zmian z Kalendarza Google (${e instanceof Error ? e.message.slice(0, 300) : e}).`),
  );
  const [rows, blocks, templates] = await Promise.all([
    listBookings(new Date(now.getTime() - 7 * 86400000), new Date(now.getTime() + 90 * 86400000)),
    listBlocks(now),
    listTemplates(),
  ]);
  const log = await smsHistory(rows.map((b) => b.id));
  const upcoming = rows.filter((b) => new Date(b.ends_at) >= now);
  const past = rows.filter((b) => new Date(b.ends_at) < now).reverse();
  const today = localDay(now, tz);

  return (
    <>
      <Nav active="wizyty" />
      {komunikat && <div className="alert ok">{komunikat}</div>}
      {syncError && <div className="alert error">{syncError}</div>}

      <section className="card">
        <h2>Dodaj wizytę</h2>
        <form method="post" action="/api/admin/booking">
          <input type="hidden" name="action" value="add" />
          <DayTimeFields defaultDay={isDay(dzien) ? dzien : today} />
          <div className="row">
            <div>
              <label htmlFor="firstName">Imię</label>
              <input id="firstName" name="firstName" type="text" required minLength={2} maxLength={60} />
            </div>
            <div>
              <label htmlFor="lastName">Nazwisko</label>
              <input id="lastName" name="lastName" type="text" required minLength={2} maxLength={60} />
            </div>
            <div>
              <label htmlFor="phone">Telefon</label>
              <input id="phone" name="phone" type="tel" required inputMode="tel" />
            </div>
          </div>
          <label htmlFor="note">Notatka (opcjonalnie)</label>
          <input id="note" name="note" type="text" maxLength={500} />
          <label className="check">
            <input type="checkbox" name="sms" defaultChecked />
            <span>Wyślij SMS z potwierdzeniem</span>
          </label>
          <button className="btn">Zapisz wizytę</button>
        </form>
      </section>

      <section className="card">
        <h2>Nadchodzące wizyty ({upcoming.filter((b) => b.status === "confirmed").length})</h2>
        {upcoming.length === 0 && <p className="muted">Brak zaplanowanych wizyt.</p>}
        <div className="table-scroll">
          <table>
            <tbody>
              {upcoming.map((b) => (
                <Row key={b.id} b={b} templates={templates} log={log[b.id]} />
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted">
          Odwołanie w panelu usuwa wizytę z Kalendarza Google, ale nie wysyła SMS-a. Jeśli trzeba, wybierz z menu
          szablon „Odwołanie wizyty przez gabinet”.
        </p>
      </section>

      {past.length > 0 && (
        <section className="card">
          <h2>Ostatnie 7 dni</h2>
          <p className="small muted" style={{ marginTop: -6 }}>
            Podziękowanie SMS wychodzi wieczorem w dniu wizyty. Oznacz „Nie przyszedł”, żeby go nie wysyłać.
          </p>
          <div className="table-scroll">
            <table>
              <tbody>
                {past.map((b) => (
                  <Row key={b.id} b={b} templates={templates} log={log[b.id]} past />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card">
        <h2>Blokady (urlop, szkolenie, przerwa)</h2>
        <p className="small muted" style={{ marginTop: -6 }}>
          {googleEnabled()
            ? "Wydarzenia z Twojego Kalendarza Google też blokują terminy, więc urlop możesz wpisać po prostu tam."
            : "Kalendarz Google nie jest jeszcze podłączony."}
        </p>
        {blocks.length > 0 && (
          <table>
            <tbody>
              {blocks.map((k) => (
                <tr key={k.id}>
                  <td>
                    {dt(k.starts_at)} – {dt(k.ends_at)}
                    {k.note && <span className="muted"> · {k.note}</span>}
                  </td>
                  <td>
                    <form method="post" action="/api/admin/blocks">
                      <input type="hidden" name="action" value="delete" />
                      <input type="hidden" name="id" value={k.id} />
                      <button className="btn secondary small">Usuń</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <form method="post" action="/api/admin/blocks">
          <input type="hidden" name="action" value="add" />
          <div className="row">
            <div>
              <label htmlFor="from">Od dnia</label>
              <input id="from" name="from" type="date" required />
            </div>
            <div>
              <label htmlFor="fromTime">od godz. (puste = cały dzień)</label>
              <input id="fromTime" name="fromTime" type="time" />
            </div>
            <div>
              <label htmlFor="to">Do dnia</label>
              <input id="to" name="to" type="date" />
            </div>
            <div>
              <label htmlFor="toTime">do godz.</label>
              <input id="toTime" name="toTime" type="time" />
            </div>
          </div>
          <label htmlFor="bnote">Notatka</label>
          <input id="bnote" name="note" type="text" maxLength={200} placeholder="np. urlop" />
          <button className="btn" style={{ marginTop: 12 }}>
            Dodaj blokadę
          </button>
        </form>
      </section>

      <section className="card small">
        <h2>Linki do wklejenia</h2>
        <p>
          Profil Google (Linki do rezerwacji): <code>{siteUrl()}/?zrodlo=google</code>
          <br />
          ZnanyLekarz: <code>{siteUrl()}/?zrodlo=znanylekarz</code>
        </p>
      </section>
    </>
  );
}
