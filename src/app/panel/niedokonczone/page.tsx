import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { business } from "@/config";
import { isAdmin } from "@/lib/auth";
import { serviceName } from "@/lib/bookings";
import { DRAFT_DAYS, listDrafts, type DraftRow } from "@/lib/drafts";
import { formatDate, formatTime } from "@/lib/time";
import Nav from "../Nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Niedokończone zapisy", robots: { index: false } };

const tz = business.timezone;
const when = (iso: string) => `${formatDate(new Date(iso), tz)}, ${formatTime(new Date(iso), tz)}`;

export default async function DraftsPage() {
  if (!(await isAdmin())) redirect("/panel/login");
  let drafts: DraftRow[] = [];
  let error: string | null = null;
  try {
    drafts = await listDrafts();
  } catch (e) {
    console.error("Lista szkiców:", e);
    error = "Nie udało się pobrać listy. Jeśli to pierwsze uruchomienie, w bazie brakuje tabeli booking_drafts.";
  }

  return (
    <>
      <Nav active="niedokonczone" />
      <section className="card">
        <h2>Niedokończone zapisy</h2>
        <p className="muted small">
          Osoby, które wpisały telefon w formularzu, ale nie kliknęły „Rezerwuję wizytę”. Gdy ktoś dokończy zapis, znika
          z listy. Dane usuwamy automatycznie po {DRAFT_DAYS} dniach. Telefon wolno wykorzystać tylko, żeby pomóc w umówieniu
          wizyty, nie do reklam.
        </p>
        {error && <div className="alert error">{error}</div>}
        {!error && drafts.length === 0 && <p className="muted">Brak niedokończonych zapisów.</p>}
        {drafts.map((d) => (
          <div key={d.id} className="cal-visit">
            <span>
              <strong>{[d.first_name, d.last_name].filter(Boolean).join(" ") || "Bez imienia"}</strong> ·{" "}
              <a href={`tel:+${d.phone}`}>+{d.phone}</a>
              <br />
              <span className="muted small">
                {d.starts_at ? `Wybrany termin: ${when(d.starts_at)}` : "Bez wybranego terminu"}
                {d.service_id ? ` · ${serviceName(d.service_id)}` : ""}
                {d.source ? ` · źródło: ${d.source}` : ""}
                <br />
                Ostatnia aktywność: {when(d.updated_at)}
              </span>
            </span>
            <form method="post" action="/api/admin/draft">
              <input type="hidden" name="id" value={d.id} />
              <button className="btn secondary small">Usuń</button>
            </form>
          </div>
        ))}
      </section>
    </>
  );
}
