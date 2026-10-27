import { describe, expect, it } from "vitest";
import { addDays, localDay, localToUtc, weekday } from "./time";

const tz = "Europe/Warsaw";

describe("localToUtc", () => {
  it("zima: UTC+1", () => {
    expect(localToUtc("2026-01-15", 10 * 60, tz).toISOString()).toBe("2026-01-15T09:00:00.000Z");
  });
  it("lato: UTC+2", () => {
    expect(localToUtc("2026-07-15", 10 * 60, tz).toISOString()).toBe("2026-07-15T08:00:00.000Z");
  });
  it("dzień zmiany czasu na zimowy", () => {
    expect(localToUtc("2026-10-25", 10 * 60, tz).toISOString()).toBe("2026-10-25T09:00:00.000Z");
  });
  it("dzień zmiany czasu na letni", () => {
    expect(localToUtc("2026-03-29", 10 * 60, tz).toISOString()).toBe("2026-03-29T08:00:00.000Z");
  });
});

describe("pomocnicze", () => {
  it("localDay uwzględnia strefę", () => {
    expect(localDay(new Date("2026-06-30T22:30:00Z"), tz)).toBe("2026-07-01");
  });
  it("addDays przechodzi przez koniec miesiąca", () => {
    expect(addDays("2026-02-27", 3)).toBe("2026-03-02");
  });
  it("weekday", () => {
    expect(weekday("2026-10-26")).toBe(1);
  });
});
