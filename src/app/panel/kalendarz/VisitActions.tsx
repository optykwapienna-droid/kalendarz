import type { BookingRow } from "@/lib/db";
import { canPatientCancel } from "@/lib/bookings";
import DayTimeFields from "../DayTimeFields";

/** Odwołanie, prośba o wybór nowego terminu i przeniesienie wizyty przez gabinet. */
export default function VisitActions({ b, back, day }: { b: BookingRow; back: string; day: string }) {
  const hidden = (action: string) => (
    <>
      <input type="hidden" name="id" value={b.id} />
      <input type="hidden" name="back" value={back} />
      <input type="hidden" name="action" value={action} />
    </>
  );
  return (
    <details className="visit-actions">
      <summary>Zmień termin / odwołaj</summary>

      <form method="post" action="/api/admin/booking">
        {hidden("move")}
        <h3>Przenieś na inny termin</h3>
        <p className="muted small">Gdy nowy termin jest już ustalony z pacjentem.</p>
        <DayTimeFields defaultDay={day} idPrefix={`m-${b.id}-`} />
        <label className="check">
          <input type="checkbox" name="sms" defaultChecked /> Wyślij pacjentowi SMS z nowym terminem
        </label>
        <button className="btn small">Przenieś wizytę</button>
      </form>

      <form method="post" action="/api/admin/booking">
        {hidden("propose")}
        <h3>Poproś pacjenta o wybór nowego terminu</h3>
        {canPatientCancel(b) ? (
          <>
            <p className="muted small">
              Pacjent dostanie SMS z przeprosinami i linkiem do wyboru nowego terminu. Obecna wizyta zostaje w kalendarzu,
              dopóki pacjent jej nie przeniesie.
            </p>
            <button className="btn secondary small">Wyślij SMS z prośbą</button>
          </>
        ) : (
          <p className="muted small">Za mało czasu do wizyty, żeby pacjent zmienił ją online. Lepiej zadzwonić.</p>
        )}
      </form>

      <form method="post" action="/api/admin/booking">
        {hidden("cancel")}
        <h3>Odwołaj wizytę</h3>
        <label className="check">
          <input type="checkbox" name="sms" defaultChecked /> Wyślij pacjentowi SMS z przeprosinami
        </label>
        <button className="btn danger small">Odwołaj wizytę</button>
      </form>
    </details>
  );
}
