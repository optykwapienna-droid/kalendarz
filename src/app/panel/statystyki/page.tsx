import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { business } from "@/config";
import { isAdmin } from "@/lib/auth";
import { db, type BookingRow } from "@/lib/db";
import { listDrafts } from "@/lib/drafts";
import { monthlyStats } from "@/lib/stats";
import { localDay } from "@/lib/time";
import Nav from "../Nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Statystyki", robots: { index: false } };

const tz = business.timezone;

function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const l = new Intl.DateTimeFormat("pl-PL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 15)));
  return l.charAt(0).toUpperCase() + l.slice(1);
}

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

  return (
    <>
      <Nav active="statystyki" />
      <section className="card">
        <h2>Rezerwacje</h2>
        <p className="muted small">
          Liczone według dnia, w którym ktoś się zapisał (nie dnia wizyty). „Online” to zapisy przez stronę, „panel” to
          wizyty wpisane przez Ciebie. Źródło pochodzi z linku, np. ?zrodlo=google.
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
