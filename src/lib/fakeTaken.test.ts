import { describe, expect, it } from "vitest";
import { fakeTaken } from "./fakeTaken";

const now = new Date("2026-11-01T00:00:00Z");
const hm = (d: Date) => new Intl.DateTimeFormat("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit" }).format(d);

describe("fakeTaken", () => {
  it("daje 2–3 godziny spoza grafiku w dniu otwarcia", () => {
    const t = fakeTaken("2026-11-02", now, 60).map(hm); // poniedziałek
    expect(t.length).toBeGreaterThanOrEqual(2);
    expect(t.length).toBeLessThanOrEqual(3);
    for (const x of t) expect(["10:00", "10:30", "15:00", "16:00", "17:00", "14:30", "15:30", "16:30"]).not.toContain(x);
  });
  it("za każdym razem te same godziny", () => {
    expect(fakeTaken("2026-11-03", now, 60)).toEqual(fakeTaken("2026-11-03", now, 60));
  });
  it("w czwartek, niedzielę i święto nic", () => {
    expect(fakeTaken("2026-11-05", now, 60)).toEqual([]);
    expect(fakeTaken("2026-11-08", now, 60)).toEqual([]);
    expect(fakeTaken("2026-11-11", now, 60)).toEqual([]);
  });
  it("nie pokazuje godzin z przeszłości", () => {
    expect(fakeTaken("2026-11-02", new Date("2026-11-02T19:00:00Z"), 60)).toEqual([]);
  });
});
