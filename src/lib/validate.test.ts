import { describe, expect, it } from "vitest";
import { normalizePhone, validateBooking } from "./validate";

const good = {
  serviceId: "badanie",
  start: "2026-10-26T09:00:00.000Z",
  firstName: " Jan ",
  lastName: "Kowalski",
  phone: "600 100 200",
  answers: { cel: "Okulary do dali", dolegliwosci: ["Bóle głowy", "coś spoza listy"], obce: "x" },
  privacyAccepted: true,
};

describe("normalizePhone", () => {
  it.each([
    ["600 100 200", "48600100200"],
    ["+48 600-100-200", "48600100200"],
    ["0048600100200", "48600100200"],
    ["12345", null],
  ])("%s", (raw, out) => expect(normalizePhone(raw)).toBe(out));
});

describe("validateBooking", () => {
  it("przyjmuje poprawne dane i czyści odpowiedzi", () => {
    const r = validateBooking(good);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.firstName).toBe("Jan");
    expect(r.value.phone).toBe("48600100200");
    expect(r.value.answers).toEqual({ cel: "Okulary do dali", dolegliwosci: ["Bóle głowy"] });
  });

  it("wystarczy imię, nazwisko i telefon", () => {
    expect(validateBooking({ ...good, answers: undefined }).ok).toBe(true);
  });

  it("wymaga nazwiska i telefonu", () => {
    expect(validateBooking({ ...good, lastName: "" }).ok).toBe(false);
    expect(validateBooking({ ...good, phone: "" }).ok).toBe(false);
  });

  it("wymaga akceptacji zasad od pacjenta, ale nie w panelu", () => {
    expect(validateBooking({ ...good, privacyAccepted: false }).ok).toBe(false);
    expect(validateBooking({ ...good, privacyAccepted: false }, { fromPanel: true }).ok).toBe(true);
  });

  it("odrzuca boty", () => {
    expect(validateBooking({ ...good, website: "http://spam" }).ok).toBe(false);
  });
});
