import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { business } from "@/config";
import { isAdmin } from "@/lib/auth";
import { formatDate, formatTime } from "@/lib/time";
import { listConsents, voucherText, VOUCHERS, type ConsentRow } from "@/lib/vouchers";
import Nav from "../Nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Vouchery", robots: { index: false } };

const tz = business.timezone;
const when = (iso: string) => `${formatDate(new Date(iso), tz)}, ${formatTime(new Date(iso), tz)}`;

export default async function VouchersPage({
  searchParams,
}: {
  searchParams: Promise<{ komunikat?: string; tel?: string; imie?: string }>;
}) {
  if (!(await isAdmin())) redirect("/panel/login");
  const sp = await searchParams;
  let consents: ConsentRow[] = [];
  let error: string | null = null;
  try {
    consents = await listConsents();
  } catch (e) {
    console.error("Lista zgód:", e);
    error = "Nie udało się pobrać listy zgód. Jeśli to pierwsze uruchomienie, w bazie brakuje tabeli marketing_consents.";
  }

  return (
    <>
      <Nav active="vouchery" />
      {sp.komunikat && <div className="alert ok">{sp.komunikat}</div>}
      {error && <div className="alert error">{error}</div>}

      <section className="card">
        <h2>Wyślij voucher SMS-em</h2>
        <p className="muted small">
          Dla klientów, którzy kupili okulary. SMS z rabatem to informacja handlowa: wysyłaj go tylko osobom, które się na to
          zgodziły (np. zapytane przy kasie). Zgoda zapisuje się poniżej.
        </p>
        <form method="post" action="/api/admin/voucher">
          <div className="row">
            <div>
              <label htmlFor="v-name">Imię (do zwrotu Pan/Pani)</label>
              <input id="v-name" name="firstName" type="text" maxLength={60} defaultValue={sp.imie ?? ""} />
            </div>
            <div>
              <label htmlFor="v-phone">Telefon</label>
              <input id="v-phone" name="phone" type="tel" inputMode="tel" required defaultValue={sp.tel ?? ""} />
            </div>
          </div>
          <label htmlFor="v-voucher">Voucher</label>
          <select id="v-voucher" name="voucher" required defaultValue="">
            <option value="" disabled>
              Wybierz…
            </option>
            {VOUCHERS.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
          <label className="check">
            <input type="checkbox" name="consent" required />
            <span>Klient zgodził się na SMS z ofertą</span>
          </label>
          <button className="btn">Wyślij voucher</button>
        </form>
        <details className="small muted" style={{ marginTop: 12 }}>
          <summary>Treść SMS-a</summary>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{voucherText("20", "Anna")}</pre>
        </details>
      </section>

      <section className="card">
        <h2>Klienci ze zgodą na oferty ({consents.length})</h2>
        {!error && consents.length === 0 && <p className="muted">Nikt jeszcze nie dostał vouchera.</p>}
        {consents.map((c) => (
          <div key={c.phone} className="cal-visit">
            <span>
              <strong>{c.first_name || "Bez imienia"}</strong> · <a href={`tel:+${c.phone}`}>+{c.phone}</a>
              <br />
              <span className="muted small">
                Zgoda od {when(c.given_at)}
                {c.last_voucher && c.last_sent_at && ` · ostatnio voucher -${c.last_voucher}% (${when(c.last_sent_at)})`}
              </span>
            </span>
            <form method="post" action="/api/admin/voucher">
              <input type="hidden" name="action" value="withdraw" />
              <input type="hidden" name="phone" value={c.phone} />
              <button className="btn secondary small">Wycofaj zgodę</button>
            </form>
          </div>
        ))}
      </section>
    </>
  );
}
