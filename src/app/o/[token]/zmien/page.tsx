import type { Metadata } from "next";
import { booking, business } from "@/config";
import { canPatientCancel, findByToken, serviceName } from "@/lib/bookings";
import { formatDate, formatTime } from "@/lib/time";
import RescheduleForm from "./RescheduleForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: `Zmiana terminu | ${business.name}`, robots: { index: false } };

export default async function ReschedulePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await findByToken(token);
  const tz = business.timezone;

  if (!b || !canPatientCancel(b)) {
    return (
      <section className="card">
        <h1 style={{ marginTop: 0 }}>Nie można zmienić terminu</h1>
        <p>
          Termin można zmienić online najpóźniej {booking.cancelUntilHours} godz. przed wizytą.
          {business.phone && <> W pilnej sprawie zadzwoń: {business.phone}.</>}
        </p>
        {b && (
          <a className="btn secondary" href={`/o/${encodeURIComponent(token)}`}>
            Wróć do wizyty
          </a>
        )}
      </section>
    );
  }

  const start = new Date(b.starts_at);
  return (
    <section className="card">
      <h1 style={{ marginTop: 0 }}>Zmiana terminu</h1>
      <p className="muted">
        Obecny termin: {formatDate(start, tz)}, godz. {formatTime(start, tz)} · {serviceName(b.service_id)}
      </p>
      <RescheduleForm token={token} serviceId={b.service_id} current={b.starts_at} />
      <p className="small" style={{ marginTop: 16 }}>
        <a href={`/o/${encodeURIComponent(token)}`}>Anuluj, zostaw obecny termin</a>
      </p>
    </section>
  );
}
