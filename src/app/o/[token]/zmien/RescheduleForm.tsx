"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SlotPicker, { fmtLong, fmtTime } from "../../../SlotPicker";

export default function RescheduleForm({ token, serviceId, current }: { token: string; serviceId: string; current: string }) {
  const router = useRouter();
  const [start, setStart] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reload, setReload] = useState(0);

  async function submit() {
    if (!start) return;
    setError(null);
    setSending(true);
    const res = await fetch("/api/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ t: token, start }),
    }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setSending(false);
      setError(body?.error ?? "Coś poszło nie tak. Spróbuj ponownie lub zadzwoń do nas.");
      if (res?.status === 409) {
        setStart(null);
        setReload((n) => n + 1);
      }
      return;
    }
    router.push(`/o/${token}?zmiana=1`);
  }

  return (
    <>
      <SlotPicker serviceId={serviceId} value={start} onChange={setStart} reload={reload} exclude={current} />
      {error && <div className="alert error">{error}</div>}
      {start && (
        <div className="summary">
          Nowy termin:{" "}
          <strong>
            {fmtLong.format(new Date(start))}, godz. {fmtTime.format(new Date(start))}
          </strong>
          <div style={{ marginTop: 10 }}>
            <button className="btn" type="button" disabled={sending} onClick={submit}>
              {sending ? "Zmieniam…" : "Potwierdź zmianę terminu"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
