"use client";

import { useEffect, useState } from "react";
import { PANEL_TIMES } from "@/lib/panelTimes";

/** Dzień i godzina wizyty w panelu; po wybraniu dnia lista godzin pomija te już zajęte. */
export default function DayTimeFields({ defaultDay, idPrefix = "" }: { defaultDay: string; idPrefix?: string }) {
  const [day, setDay] = useState(defaultDay);
  const [time, setTime] = useState("");
  const [taken, setTaken] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTaken(null);
    if (!day) return;
    fetch(`/api/admin/busy?day=${day}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (cancelled) return;
        setTaken(j.taken);
        setTime((t) => (j.taken.includes(t) ? "" : t));
      })
      .catch(() => !cancelled && setTaken([]));
    return () => {
      cancelled = true;
    };
  }, [day]);

  const free = PANEL_TIMES.filter((t) => !taken?.includes(t));
  return (
    <div className="row">
      <div>
        <label htmlFor={`${idPrefix}day`}>Dzień</label>
        <input id={`${idPrefix}day`} name="day" type="date" required value={day} onChange={(e) => setDay(e.target.value)} />
      </div>
      <div>
        <label htmlFor={`${idPrefix}time`}>Godzina</label>
        <select id={`${idPrefix}time`} name="time" required value={time} onChange={(e) => setTime(e.target.value)}>
          <option value="" disabled>
            {taken === null ? "Sprawdzam wolne godziny…" : free.length ? "Wybierz…" : "Brak wolnych godzin"}
          </option>
          {free.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
