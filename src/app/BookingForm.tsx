"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Question, Service } from "@/config";

const TZ = "Europe/Warsaw";
const PAGE_DAYS = 14;

const fmtTime = new Intl.DateTimeFormat("pl-PL", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const fmtLong = new Intl.DateTimeFormat("pl-PL", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });

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

type Answers = Record<string, string | string[]>;

export default function BookingForm({
  services,
  questions,
  source,
}: {
  services: Service[];
  questions: Question[];
  source?: string;
}) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(services[0].id);
  const [from, setFrom] = useState(today);
  const [slots, setSlots] = useState<Record<string, string[]> | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    fetch(`/api/slots?service=${serviceId}&from=${from}&days=${PAGE_DAYS}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j) => {
        if (cancelled) return;
        setSlots(j.slots);
        const first = Object.keys(j.slots).find((d) => j.slots[d].length > 0) ?? null;
        setDay((cur) => (cur && j.slots[cur]?.length ? cur : first));
      })
      .catch(() => !cancelled && setError("Nie udało się pobrać terminów. Odśwież stronę."));
    return () => {
      cancelled = true;
    };
  }, [serviceId, from, reload]);

  const days = useMemo(() => (slots ? Object.keys(slots) : []), [slots]);
  const service = services.find((s) => s.id === serviceId)!;
  const hasAny = days.some((d) => slots![d].length > 0);

  function setAnswer(id: string, value: string | string[]) {
    setAnswers((a) => ({ ...a, [id]: value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!start) return;
    setError(null);
    setSending(true);
    const f = new FormData(e.currentTarget);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        start,
        firstName: f.get("firstName"),
        lastName: f.get("lastName"),
        phone: f.get("phone"),
        answers,
        privacyAccepted: f.get("privacy") === "on",
        source,
        website: f.get("website"),
      }),
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
    router.push(`/o/${body.token}?nowa=1`);
  }

  return (
    <form onSubmit={submit}>
      {services.length > 1 && (
        <section className="card">
          <h2>1. Usługa</h2>
          {services.map((s) => (
            <label key={s.id} className="service">
              <input
                type="radio"
                name="service"
                checked={s.id === serviceId}
                onChange={() => {
                  setServiceId(s.id);
                  setStart(null);
                }}
              />
              <span>
                <strong>{s.name}</strong>
                <span className="muted small">
                  {s.durationMin} min{s.price ? ` · ${s.price}` : ""}
                </span>
              </span>
            </label>
          ))}
        </section>
      )}

      <section className="card">
        <h2>Wybierz termin</h2>
        <p className="muted small" style={{ marginTop: -6 }}>
          {service.name} · {service.durationMin} min
        </p>
        {!slots && <p className="muted">Ładowanie terminów…</p>}
        {slots && (
          <>
            <div className="days" role="listbox" aria-label="Dzień wizyty">
              {days.map((d) => {
                const l = dayLabel(d);
                const free = slots[d].length > 0;
                return (
                  <button
                    type="button"
                    key={d}
                    className={`day${d === day ? " active" : ""}`}
                    disabled={!free}
                    aria-selected={d === day}
                    onClick={() => {
                      setDay(d);
                      setStart(null);
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
                  <button
                    type="button"
                    key={s}
                    className={`slot${s === start ? " active" : ""}`}
                    onClick={() => setStart(s)}
                  >
                    {fmtTime.format(new Date(s))}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {start && (
        <section className="card">
          <h2>Twoje dane</h2>
          <div className="summary">
            <strong>{fmtLong.format(new Date(start))}, godz. {fmtTime.format(new Date(start))}</strong>
            <br />
            <span className="small">{service.name}</span>
          </div>

          <div className="row">
            <div>
              <label htmlFor="firstName">Imię</label>
              <input id="firstName" name="firstName" type="text" autoComplete="given-name" required minLength={2} maxLength={60} />
            </div>
            <div>
              <label htmlFor="lastName">Nazwisko</label>
              <input id="lastName" name="lastName" type="text" autoComplete="family-name" required minLength={2} maxLength={60} />
            </div>
          </div>

          <label htmlFor="phone">Telefon komórkowy</label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" required placeholder="np. 600 100 200" />
          <span className="field-hint">Wyślemy SMS z potwierdzeniem, a dzień przed wizytą przypomnienie.</span>

          <div className="hp" aria-hidden="true">
            <label htmlFor="website">Strona WWW</label>
            <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>

          {questions.length > 0 && (
            <h2 style={{ marginTop: 24 }}>
              Kilka pytań przed wizytą <span className="field-hint">(nieobowiązkowe)</span>
            </h2>
          )}
          {questions.map((q) => (
            <div key={q.id}>
              <label htmlFor={`q-${q.id}`}>{q.label}</label>
              {q.type === "select" && (
                <select
                  id={`q-${q.id}`}
                  required={q.required}
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                >
                  <option value="">Wybierz…</option>
                  {q.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              )}
              {q.type === "multi" && (
                <div className="chips" id={`q-${q.id}`}>
                  {q.options.map((o) => {
                    const list = (answers[q.id] as string[]) ?? [];
                    return (
                      <label key={o} className="chip">
                        <input
                          type="checkbox"
                          checked={list.includes(o)}
                          onChange={(e) => setAnswer(q.id, e.target.checked ? [...list, o] : list.filter((x) => x !== o))}
                        />
                        {o}
                      </label>
                    );
                  })}
                </div>
              )}
              {q.type === "text" && (
                <textarea
                  id={`q-${q.id}`}
                  maxLength={500}
                  placeholder={q.placeholder}
                  required={q.required}
                  value={(answers[q.id] as string) ?? ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}
            </div>
          ))}

          <label className="check">
            <input type="checkbox" name="privacy" required />
            <span>
              Zapoznałem/am się z{" "}
              <a href="/polityka-prywatnosci" target="_blank">
                zasadami przetwarzania danych
              </a>{" "}
              w celu umówienia wizyty.
            </span>
          </label>

          {error && <div className="alert error">{error}</div>}
          <button className="btn" type="submit" disabled={sending} style={{ marginTop: 8 }}>
            {sending ? "Rezerwuję…" : "Rezerwuję wizytę"}
          </button>
        </section>
      )}
      {!start && error && <div className="alert error">{error}</div>}
    </form>
  );
}
