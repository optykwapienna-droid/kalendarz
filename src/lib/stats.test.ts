import { describe, expect, it } from "vitest";
import { monthlyStats, sourceLabel } from "./stats";

describe("statystyki", () => {
  it("nazywa źródła", () => {
    expect(sourceLabel({ source: "google", created_by: "patient" })).toBe("Google");
    expect(sourceLabel({ source: null, created_by: "patient" })).toBe("Strona");
    expect(sourceLabel({ source: "telefon", created_by: "panel" })).toBe("Telefon");
  });

  it("liczy rezerwacje w miesiącach", () => {
    const rows = [
      { created_at: "2026-10-01T10:00:00Z", created_by: "patient", source: "google", status: "confirmed" },
      { created_at: "2026-10-02T10:00:00Z", created_by: "panel", source: "telefon", status: "cancelled" },
      { created_at: "2026-09-02T10:00:00Z", created_by: "patient", source: null, status: "no_show" },
    ] as const;
    const s = monthlyStats([...rows], (iso) => iso.slice(0, 7));
    expect(s.map((m) => m.month)).toEqual(["2026-10", "2026-09"]);
    expect(s[0]).toMatchObject({ total: 2, online: 1, panel: 1, cancelled: 1, sources: { Google: 1, Telefon: 1 } });
    expect(s[1]).toMatchObject({ total: 1, noShow: 1, sources: { Strona: 1 } });
  });
});
