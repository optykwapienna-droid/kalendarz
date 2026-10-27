import { describe, expect, it } from "vitest";
import { slotsForDay } from "./slots";

const times = (day: string) =>
  slotsForDay(day, { now: new Date("2026-11-01T00:00:00Z"), durationMin: 60, busy: [] }).map((d) =>
    new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit" }).format(d),
  );

describe("stałe godziny badań gabinetu", () => {
  it("poniedziałek–środa: 4 badania", () => {
    for (const d of ["2026-11-02", "2026-11-03", "2026-11-04"]) expect(times(d)).toEqual(["10:30", "15:00", "16:00", "17:00"]);
  });
  it("czwartek nieczynny", () => expect(times("2026-11-05")).toEqual([]));
  it("piątek: 3 badania", () => expect(times("2026-11-06")).toEqual(["10:30", "15:00", "16:00"]));
  it("sobota: 3 badania", () => expect(times("2026-11-07")).toEqual(["11:00", "12:00", "13:00"]));
  it("niedziela nieczynna", () => expect(times("2026-11-08")).toEqual([]));
});
