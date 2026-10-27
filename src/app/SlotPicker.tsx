"use client";

import { useEffect, useMemo, useState } from "react";

const TZ = "Europe/Warsaw";
const PAGE_DAYS = 14;

export const fmtTime = new Intl.DateTimeFormat("pl-PL", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
export const fmtLong = new Intl.DateTimeFormat("pl-PL", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function dayLabel(day: string) {
  const date = new Date(day + "T12:00:00Z");
  return {
    weekday: new Intl.DateTimeFormat("pl-PL", { weekday: "short", timeZone: "UTC" }).format(date),
    day: date.getUTCDate(),
    month: new Intl.DateTimeFormat("pl-PL", { month: "short", timeZone: "UTC" }).format(date),
  };
}

/** Wybór dnia i godziny spośród wolnych terminów. `reload` wymusza ponowne pobranie (np. po konflikcie). */
export default function SlotPicker({
  serviceId,
  value,
  onChange,
  reload = 0,
  exclude,
}: {
  serviceId: string;
  value: string | null;
  onChange: (start: string | null) => void;
  reload?: number;
  exclude?: string;
}) {
  const [from, setFrom] = useState(today);
  const [slots, setSlots] = useState<Record<string, string[]> | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setError(false);
    fetch(`/api/slots?service=${serviceId}&from=${from}&days=${PAGE_DAYS}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (cancelled) return;
        const list: Record<string, string[]> = {};
        for (const [d, s] of Object.entries(j.slots as Record<string, string[]>)) {
          list[d] = exclude ? s.filter((x) => x !== exclude) : s;
        }
        setSlots(list);
        const first = Object.keys(list).find((d) => list[d].length > 0) ?? null;
        setDay((cur) => (cur && list[cur]?.length ? cur : first));
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [serviceId, from, reload, exclude]);

  const days = useMemo(() => (slots ? Object.keys(slots) : []), [slots]);
  const hasAny = days.some((d) => slots![d].length > 0);

  if (error) return <div className="alert error">Nie udało się pobrać terminów. Odśwież stronę.</div>;
  if (!slots) return <p className="muted">Ładowanie terminów…</p>;

  return (
    <>
      <div className="days" role="listbox" aria-label="Dzień wizyty">
        {days.map((d) => {
          const l = dayLabel(d);
          return (
            <button
              type="button"
              key={d}
              className={`day${d === day ? " active" : ""}`}
              disabled={slots[d].length === 0}
              aria-selected={d === day}
              onClick={() => {
                setDay(d);
                onChange(null);
              }}
            >
              <small>{l.weekday}</small>
              <b>{l.day}</b>
              <small>{l.month}</small>
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {from > today() && (
          <button type="button" className="btn secondary small" onClick={() => setFrom(addDays(from, -PAGE_DAYS))}>
            ← Wcześniej
          </button>
        )}
        <button type="button" className="btn secondary small" onClick={() => setFrom(addDays(from, PAGE_DAYS))}>
          Późniejsze terminy →
        </button>
      </div>
      {!hasAny && <p className="muted">Brak wolnych terminów w tych dniach. Sprawdź późniejsze terminy.</p>}
      {day && slots[day]?.length > 0 && (
        <div className="slots">
          {slots[day].map((s) => (
            <button type="button" key={s} className={`slot${s === value ? " active" : ""}`} onClick={() => onChange(s)}>
              {fmtTime.format(new Date(s))}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
