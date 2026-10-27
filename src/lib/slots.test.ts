import { describe, expect, it } from "vitest";
import { slotsForDay } from "./slots";
import { formatTime } from "./time";

const tz = "Europe/Warsaw";
const hours = {
  0: [],
  1: [{ from: "10:00", to: "18:00" }],
  2: [{ from: "10:00", to: "13:00" }, { from: "14:00", to: "16:00" }],
  3: [],
  4: [],
  5: [],
  6: [{ from: "10:00", to: "14:00" }],
};
const base = { durationMin: 60, busy: [], tz, hours, stepMin: 60, minNoticeHours: 2, maxDaysAhead: 45 };
const times = (d: Date[]) => d.map((x) => formatTime(x, tz));
// Niedziela 25.10.2026, 12:00 czasu polskiego
const now = new Date("2026-10-25T11:00:00Z");

describe("slotsForDay", () => {
  it("pełny dzień roboczy", () => {
    expect(times(slotsForDay("2026-10-26", { ...base, now }))).toEqual([
      "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    ]);
  });

  it("przerwa w środku dnia", () => {
    expect(times(slotsForDay("2026-10-27", { ...base, now }))).toEqual(["10:00", "11:00", "12:00", "14:00", "15:00"]);
  });

  it("niedziela zamknięte", () => {
    expect(slotsForDay("2026-10-25", { ...base, now })).toEqual([]);
  });

  it("święto zamknięte", () => {
    expect(slotsForDay("2026-11-02", { ...base, now, hours: { ...hours, 1: hours[1] } }).length).toBe(8);
    expect(slotsForDay("2026-11-11", { ...base, now, hours: { ...hours, 3: hours[1] } })).toEqual([]);
  });

  it("zajęte terminy i blokady wypadają", () => {
    const busy = [
      { start: new Date("2026-10-26T10:30:00Z"), end: new Date("2026-10-26T11:30:00Z") }, // 11:30–12:30
    ];
    expect(times(slotsForDay("2026-10-26", { ...base, now, busy }))).toEqual([
      "10:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    ]);
  });

  it("minimalne wyprzedzenie", () => {
    const monday11 = new Date("2026-10-26T10:00:00Z"); // 11:00 w Polsce
    expect(times(slotsForDay("2026-10-26", { ...base, now: monday11 }))[0]).toBe("13:00");
  });

  it("za daleko w przyszłość", () => {
    expect(slotsForDay("2026-12-31", { ...base, now, maxDaysAhead: 30 })).toEqual([]);
  });
});
