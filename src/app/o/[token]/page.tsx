import type { Metadata } from "next";
import { booking, business, visitTips } from "@/config";
import { canPatientCancel, findByToken, serviceName } from "@/lib/bookings";
import { formatDate, formatTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Twoja wizyta | ${business.name}`, robots: { index: false } };

export default async function VisitPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ nowa?: string; zmiana?: string }>;
}) {
  const { token } = await params;
  const { nowa, zmiana } = await searchParams;
  const b = await findByToken(token);

  if (!b) {
    return (
      <section className="card">
        <h1>Nie znaleziono wizyty</h1>
        <p>Link jest niepoprawny albo dane wizyty zostały już usunięte.</p>
        <a className="btn" href="/">
          Umów nową wizytę
        </a>
      </section>
    );
  }

  const start = new Date(b.starts_at);
  const tz = business.timezone;
  const cancelled = b.status === "cancelled";

  return (
    <>
      {nowa && !cancelled && <div className="alert ok">Wizyta zarezerwowana. Potwierdzenie wysłaliśmy SMS-em na numer +{b.phone}.</div>}
      {zmiana && !cancelled && <div className="alert ok">Termin zmieniony. Nowe potwierdzenie wysłaliśmy SMS-em na numer +{b.phone}.</div>}
      {cancelled && <div className="alert error">Ta wizyta została odwołana.</div>}
      <section className="card">
        <h1 style={{ marginTop: 0 }}>{cancelled ? "Odwołana wizyta" : "Twoja wizyta"}</h1>
        <p>
          <strong>
            {formatDate(start, tz)}, godz. {formatTime(start, tz)}
          </strong>
          <br />
          {serviceName(b.service_id)}
          <br />
          {business.name}, {business.street}, {business.city} ·{" "}
          <a href={business.googleMapsUrl} target="_blank" rel="noopener">
            mapa
          </a>
        </p>
        {!cancelled && (
          <>
            <h2>Przed wizytą</h2>
            <ul>
              {visitTips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </>
        )}
        {canPatientCancel(b) ? (
          <div className="actions">
            <a className="btn" href={`/o/${encodeURIComponent(token)}/zmien`}>
              Zmień termin
            </a>
            <form method="post" action="/api/cancel">
              <input type="hidden" name="t" value={token} />
              <button className="btn danger" type="submit">
                Odwołaj wizytę
              </button>
            </form>
          </div>
        ) : (
          !cancelled && (
            <p className="muted small">
              Wizytę można zmienić lub odwołać online najpóźniej {booking.cancelUntilHours} godz. przed terminem.
              {business.phone && <> W pilnej sprawie zadzwoń: {business.phone}.</>}
            </p>
          )
        )}
        {cancelled && (
          <a className="btn" href="/">
            Umów nowy termin
          </a>
        )}
      </section>
    </>
  );
}
