import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { business, openingHours, type Weekday } from "@/config";
import { isAdmin } from "@/lib/auth";
import type { BlockRow, BookingRow } from "@/lib/db";
import { fullName, listBlocks, listBookings, serviceName } from "@/lib/bookings";
import { isHoliday } from "@/lib/holidays";
import { addDays, formatDate, formatTime, isDay, localDay, localToUtc, weekday } from "@/lib/time";
import Nav from "../Nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kalendarz", robots: { index: false } };

const tz = business.timezone;
const WEEKDAYS = ["pon", "wt", "śr", "czw", "pt", "sob", "nd"];

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, 15)),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shiftMonth(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
}

/** Dni siatki: od poniedziałku przed 1. dniem miesiąca do niedzieli po ostatnim. */
function gridDays(month: string): string[] {
  const first = `${month}-01`;
  const start = addDays(first, -((weekday(first) + 6) % 7));
  const last = addDays(`${shiftMonth(month, 1)}-01`, -1);
  const end = addDays(last, (7 - weekday(last)) % 7);
  const days: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

function blockedOn(day: string, blocks: BlockRow[]): BlockRow[] {
  const from = localToUtc(day, 0, tz).getTime();
  const to = localToUtc(addDays(day, 1), 0, tz).getTime();
  return blocks.filter((b) => new Date(b.starts_at).getTime() < to && new Date(b.ends_at).getTime() > from);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string; d?: string }>;
}) {
  if (!(await isAdmin())) redirect("/panel/login");
  const now = new Date();
  const today = localDay(now, tz);
  const sp = await searchParams;
  const month = sp.m && /^\d{4}-\d{2}$/.test(sp.m) ? sp.m : today.slice(0, 7);
  const days = gridDays(month);
  const selected = isDay(sp.d) && sp.d.startsWith(month) ? sp.d : today.startsWith(month) ? today : null;

  const from = localToUtc(days[0], 0, tz);
  const to = localToUtc(addDays(days[days.length - 1], 1), 0, tz);
  const [rows, blocks] = await Promise.all([listBookings(from, to), listBlocks(from)]);
  const visits = rows.filter((b) => b.status !== "cancelled");
  const byDay: Record<string, BookingRow[]> = {};
  for (const b of visits) (byDay[localDay(new Date(b.starts_at), tz)] ??= []).push(b);

  const inMonth = visits.filter((b) => localDay(new Date(b.starts_at), tz).startsWith(month)).length;
  const link = (m: string, d?: string) => `/panel/kalendarz?m=${m}${d ? `&d=${d}` : ""}`;

  return (
    <>
      <Nav active="kalendarz" />
      <section className="card">
        <div className="cal-head">
          <a className="btn secondary small" href={link(shiftMonth(month, -1))} aria-label="Poprzedni miesiąc">
            ←
          </a>
          <h2 style={{ margin: 0 }}>{monthLabel(month)}</h2>
          <a className="btn secondary small" href={link(shiftMonth(month, 1))} aria-label="Następny miesiąc">
            →
          </a>
        </div>
        <p className="muted small" style={{ textAlign: "center" }}>
          Wizyt w tym miesiącu: {inMonth}
          {!today.startsWith(month) && (
            <>
              {" · "}
              <a href={link(today.slice(0, 7), today)}>Dzisiaj</a>
            </>
          )}
        </p>

        <div className="cal">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-wd">
              {w}
            </div>
          ))}
          {days.map((d) => {
            const list = byDay[d] ?? [];
            const closed = isHoliday(d) || openingHours[weekday(d) as Weekday].length === 0;
            const blocked = blockedOn(d, blocks).length > 0;
            const cls = [
              "cal-day",
              d.startsWith(month) ? "" : "other",
              closed ? "closed" : "",
              blocked ? "blocked" : "",
              d === today ? "today" : "",
              d === selected ? "selected" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <a key={d} className={cls} href={link(month, d)}>
                <span className="cal-num">{Number(d.slice(8))}</span>
                {list.length > 0 && <span className="cal-count">{list.length}</span>}
                <span className="cal-list">
                  {list.slice(0, 4).map((b) => (
                    <span key={b.id} className={b.status === "no_show" ? "no-show" : ""}>
                      {formatTime(new Date(b.starts_at), tz)} {b.last_name}
                    </span>
                  ))}
                  {list.length > 4 && <span>+{list.length - 4}</span>}
                </span>
              </a>
            );
          })}
        </div>
        <p className="muted small">
          <span className="cal-legend blocked" /> blokada &nbsp; <span className="cal-legend closed" /> nieczynne
        </p>
      </section>

      {selected && (
        <section className="card">
          <h2>{formatDate(localToUtc(selected, 12 * 60, tz), tz)}</h2>
          {isHoliday(selected) && <p className="muted">Święto, gabinet nieczynny.</p>}
          {blockedOn(selected, blocks).map((b) => (
            <p key={b.id} className="muted small">
              Blokada {formatTime(new Date(b.starts_at), tz)}–{formatTime(new Date(b.ends_at), tz)}
              {b.note ? `: ${b.note}` : ""}
            </p>
          ))}
          {(byDay[selected] ?? []).length === 0 ? (
            <p className="muted">Brak wizyt.</p>
          ) : (
            (byDay[selected] ?? []).map((b) => (
              <div key={b.id} className="cal-visit">
                <strong>{formatTime(new Date(b.starts_at), tz)}</strong>
                <span>
                  {fullName(b)} · <a href={`tel:+${b.phone}`}>+{b.phone}</a>
                  <br />
                  <span className="muted small">
                    {serviceName(b.service_id)}
                    {b.status === "no_show" ? " · nie przyszedł" : ""}
                  </span>
                </span>
              </div>
            ))
          )}
          <p className="small" style={{ marginTop: 12 }}>
            <a href={`/panel?dzien=${selected}`}>Dodaj wizytę tego dnia</a>
          </p>
        </section>
      )}
    </>
  );
}
