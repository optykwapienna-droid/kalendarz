import { describe, expect, it } from "vitest";
import { isHoliday, polishHolidays } from "./holidays";

describe("polishHolidays", () => {
  it("Wielkanoc i Boże Ciało 2026", () => {
    const h = polishHolidays(2026);
    expect(h.has("2026-04-05")).toBe(true);
    expect(h.has("2026-04-06")).toBe(true);
    expect(h.has("2026-06-04")).toBe(true);
  });
  it("Wigilia od 2025", () => {
    expect(isHoliday("2026-12-24")).toBe(true);
    expect(isHoliday("2024-12-24")).toBe(false);
  });
  it("zwykły dzień", () => {
    expect(isHoliday("2026-10-27")).toBe(false);
  });
});
