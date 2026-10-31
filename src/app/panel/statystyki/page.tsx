import { Fragment } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { business } from "@/config";
import { isAdmin } from "@/lib/auth";
import { db, type BookingRow } from "@/lib/db";
import { listDrafts } from "@/lib/drafts";
import { monthlyStats, sourceLabel } from "@/lib/stats";
import { addDays, localDay } from "@/lib/time";
import { type VisitDay, visitsSince, weeklyVisits } from "@/lib/visits";
import Nav from "../Nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Statystyki", robots: { index: false } };

const tz = business.timezone;

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const l = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
  return l.charAt(0).toUpperCase() + l.slice(1);
}

function weekLabel(monday: string): string {
  const short = (day: string) => `${Number(day.slice(8, 10))}.${day.slice(5, 7)}`;
  return `${short(monday)}–${short(addDays(monday, 6))}`;
}

const WEEKS = 8;

export default async function StatsPage() {
  if (!(await isAdmin())) redirect("/panel/login");
  const since = new Date();
  since.setMonth(since.getMonth() - 12);
  const { data, error } = await db()
    .from("bookings")
    .select("created_at, created_by, source, status")
    .gte("created_at", since.toISOString());
  if (error) throw error;
  const months = monthlyStats(data as Pick<BookingRow, "created_at" | "created_by" | "source" | "status">[], (iso) =>
    localDay(new Date(iso), tz).slice(0, 7),
  );
  const drafts = await listDrafts().catch(() => null);

  const today = localDay(new Date(), tz);
  const visitRes = await db()
    .from("site_visits")
    .select("day, visits")
    .gte("day", addDays(today, -7 * WEEKS));
  const visits = visitRes.error ? null : (visitRes.data as VisitDay[]);
  const bookingDays = (data as Pick<BookingRow, "created_at" | "created_by" | "source">[]).map((b) => ({
    day: localDay(new Date(b.created_at), tz),
    source: sourceLabel(b),
    fromSite: b.source?.toLowerCase() === "strona",
  }));
  const weeks = visits && weeklyVisits(visits, bookingDays, today, WEEKS);

  return (
    <>
      <Nav active="statystyki" />
      <section className="card">
        <h2>Odwiedziny strony ireneuszgalant.pl</h2>
        {!visits || !weeks ? (
          <p className="muted">Licznik nie jest jeszcze włączony w bazie (uruchom nową część supabase/schema.sql).</p>
        ) : (
          <>
            <p>
              Dziś: <strong>{visitsSince(visits, today, 1)}</strong> · ostatnie 7 dni:{" "}
              <strong>{visitsSince(visits, today, 7)}</strong> · ostatnie 30 dni:{" "}
              <strong>{visitsSince(visits, today, 30)}</strong>
            </p>
            <table>
              <thead>
                <tr>
                  <th>Tydzień</th>
                  <th>Odwiedziny</th>
                  <th>Zapisy ze strony</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => {
                  const sources = Object.entries(w.sources).sort((a, b) => b[1] - a[1]);
                  const split = sources.length > 0 ? { borderBottom: "none", paddingBottom: 2 } : undefined;
                  return (
                    <Fragment key={w.week}>
                      <tr>
                        <td style={{ whiteSpace: "nowrap", ...split }}>{weekLabel(w.week)}</td>
                        <td style={split}>
                          <strong>{w.visits}</strong>
                        </td>
                        <td style={split}>
                          {w.bookings}
                          {w.bookings > 0 && w.bookings <= w.visits && (
                            <span className="muted small"> ({Math.round((w.bookings / w.visits) * 100)}%)</span>
                          )}
                        </td>
                      </tr>
                      {sources.length > 0 && (
                        <tr>
                          <td colSpan={3} className="muted small" style={{ paddingTop: 0 }}>
                            Wszystkie zapisy: {sources.map(([k, v]) => `${k} ${v}`).join(" · ")}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
        <p className="muted small">
          Jedna odwiedzina to jedno otwarcie strony w przeglądarce (odświeżanie nie liczy się drugi raz). Roboty
          wyszukiwarek pomijamy. Licznik nie używa cookies i nie zapisuje żadnych danych o odwiedzających. „Zapisy ze
          strony” to rezerwacje zrobione przyciskiem „Umów wizytę” na stronie, a linijka „Wszystkie zapisy” pod
          tygodniem pokazuje, skąd przyszły wszystkie rezerwacje (Facebook, Google…).
        </p>
      </section>
      <section className="card">
        <h2>Rezerwacje</h2>
        <p className="muted small">
          Liczone według dnia, w którym ktoś się zapisał (nie dnia wizyty). „Online” to zapisy przez stronę, „panel” to
          wizyty wpisane przez Ciebie. Źródło pochodzi z linku, np. ?zrodlo=google; „Bez oznaczenia” to wejścia z linku bez tej końcówki.
        </p>
        {drafts && (
          <p>
            Niedokończone zapisy (ostatnie 7 dni): <strong>{drafts.length}</strong> · <a href="/panel/niedokonczone">zobacz</a>
          </p>
        )}
        {months.length === 0 ? (
          <p className="muted">Brak rezerwacji w ostatnich 12 miesiącach.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Miesiąc</th>
                  <th>Razem</th>
                  <th>Online</th>
                  <th>Panel</th>
                  <th>Odwołane</th>
                  <th>Nie przyszli</th>
                  <th>Skąd</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.month}>
                    <td style={{ whiteSpace: "nowrap" }}>{monthLabel(m.month)}</td>
                    <td>
                      <strong>{m.total}</strong>
                    </td>
                    <td>{m.online}</td>
                    <td>{m.panel}</td>
                    <td>{m.cancelled}</td>
                    <td>{m.noShow}</td>
                    <td className="small">
                      {Object.entries(m.sources)
                        .sort((a, b) => b[1] - a[1])
                        .map(([k, v]) => `${k} ${v}`)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
