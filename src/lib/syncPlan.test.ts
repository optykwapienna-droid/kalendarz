import { describe, expect, it } from "vitest";
import { planSync } from "./syncPlan";

const b = (id: string, ev: string | null, status = "confirmed") => ({
  id,
  google_event_id: ev,
  status,
  starts_at: "2026-11-03T09:00:00.000Z",
  ends_at: "2026-11-03T10:00:00.000Z",
});
const ev = (eventId: string, bookingId: string, extra: Partial<{ cancelled: boolean; start: Date; end: Date }> = {}) => ({
  eventId,
  bookingId,
  cancelled: false,
  start: new Date("2026-11-03T09:00:00.000Z"),
  end: new Date("2026-11-03T10:00:00.000Z"),
  ...extra,
});

describe("planSync", () => {
  it("bez zmian", () => {
    expect(planSync([b("1", "e1")], [ev("e1", "1")])).toEqual({ cancel: [], move: [] });
  });

  it("usunięte w Google odwołuje wizytę", () => {
    expect(planSync([b("1", "e1")], [ev("e1", "1", { cancelled: true })]).cancel).toEqual(["1"]);
  });

  it("przesunięte w Google zmienia termin", () => {
    const start = new Date("2026-11-04T12:00:00.000Z");
    const end = new Date("2026-11-04T13:00:00.000Z");
    expect(planSync([b("1", "e1")], [ev("e1", "1", { start, end })]).move).toEqual([{ id: "1", start, end }]);
  });

  it("pomija wizyty już odwołane, bez wydarzenia i obce wydarzenia", () => {
    const plan = planSync(
      [b("1", "e1", "cancelled"), b("2", null), b("3", "e3")],
      [ev("e1", "1", { cancelled: true }), ev("e3", "inna", { cancelled: true })],
    );
    expect(plan).toEqual({ cancel: [], move: [] });
  });
});
