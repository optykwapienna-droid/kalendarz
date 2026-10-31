import { describe, expect, it } from "vitest";
import { shouldCount, visitsSince, weekStart, weeklyVisits } from "./visits";

const chrome = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

describe("odwiedziny strony", () => {
  it("liczy tylko wejścia ze strony gabinetu, bez robotów", () => {
    expect(shouldCount("https://ireneuszgalant.pl", chrome)).toBe(true);
    expect(shouldCount("https://www.ireneuszgalant.pl", chrome)).toBe(true);
    expect(shouldCount("https://example.com", chrome)).toBe(false);
    expect(shouldCount(null, chrome)).toBe(false);
    expect(shouldCount("https://ireneuszgalant.pl", "Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(false);
    expect(shouldCount("https://ireneuszgalant.pl", null)).toBe(false);
  });

  it("tydzień zaczyna się w poniedziałek", () => {
    expect(weekStart("2026-10-30")).toBe("2026-10-26"); // piątek
    expect(weekStart("2026-10-26")).toBe("2026-10-26");
    expect(weekStart("2026-11-01")).toBe("2026-10-26"); // niedziela
  });

  it("sumuje dni i tygodnie", () => {
    const rows = [
      { day: "2026-10-30", visits: 5 },
      { day: "2026-10-26", visits: 3 },
      { day: "2026-10-25", visits: 2 },
      { day: "2026-09-01", visits: 100 },
    ];
    expect(visitsSince(rows, "2026-10-30", 1)).toBe(5);
    expect(visitsSince(rows, "2026-10-30", 7)).toBe(10);
    const w = weeklyVisits(rows, ["2026-10-27", "2026-10-20"], "2026-10-30", 3);
    expect(w).toEqual([
      { week: "2026-10-26", visits: 8, bookings: 1 },
      { week: "2026-10-19", visits: 2, bookings: 1 },
      { week: "2026-10-12", visits: 0, bookings: 0 },
    ]);
  });
});
