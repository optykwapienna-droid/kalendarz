import { describe, expect, it } from "vitest";
import { visibleSlots } from "./hidden";

const day = "2026-11-10";
const today = "2026-11-01";
const slots = Array.from({ length: 40 }, (_, i) => new Date(Date.UTC(2026, 10, 10 + Math.floor(i / 4), 9 + (i % 4))));

describe("visibleSlots", () => {
  it("ukrywa mniej więcej zadaną część", () => {
    const shown = visibleSlots(day, today, slots, 0.33, 3);
    expect(shown.length).toBeGreaterThan(15);
    expect(shown.length).toBeLessThan(40);
  });
  it("za każdym razem ukrywa te same godziny", () => {
    expect(visibleSlots(day, today, slots, 0.33, 3)).toEqual(visibleSlots(day, today, slots, 0.33, 3));
  });
  it("najbliższe dni pokazuje w całości", () => {
    expect(visibleSlots("2026-11-02", today, slots, 0.33, 3)).toEqual(slots);
  });
  it("zostawia co najmniej jeden termin", () => {
    expect(visibleSlots(day, today, slots.slice(0, 4), 0.999, 0)).toHaveLength(1);
  });
  it("nic nie ukrywa przy udziale 0", () => {
    expect(visibleSlots(day, today, slots, 0, 0)).toEqual(slots);
  });
});
