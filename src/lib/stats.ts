import type { BookingRow } from "./db";

export type MonthStats = {
  month: string; // RRRR-MM
  total: number;
  online: number;
  panel: number;
  cancelled: number;
  noShow: number;
  sources: Record<string, number>;
};

const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  facebook: "Facebook",
  fb: "Facebook",
  instagram: "Instagram",
  ig: "Instagram",
  znanylekarz: "ZnanyLekarz",
  telefon: "Telefon",
  voucher: "Voucher -20%",
  voucher20: "Voucher -20%",
  voucher50: "Voucher -50%",
};

/** Skąd przyszła rezerwacja: z linku ?zrodlo=… albo „Strona” (wejście bez oznaczenia). */
export function sourceLabel(b: Pick<BookingRow, "source" | "created_by">): string {
  const s = (b.source ?? "").toLowerCase();
  if (s) return SOURCE_LABELS[s] ?? s;
  return b.created_by === "panel" ? "Panel" : "Strona";
}

/** Rezerwacje pogrupowane wg miesiąca, w którym zostały zrobione (od najnowszego). */
export function monthlyStats(rows: Pick<BookingRow, "created_at" | "created_by" | "source" | "status">[], monthOf: (iso: string) => string): MonthStats[] {
  const map = new Map<string, MonthStats>();
  for (const b of rows) {
    const month = monthOf(b.created_at);
    let m = map.get(month);
    if (!m) map.set(month, (m = { month, total: 0, online: 0, panel: 0, cancelled: 0, noShow: 0, sources: {} }));
    m.total++;
    if (b.created_by === "panel") m.panel++;
    else m.online++;
    if (b.status === "cancelled") m.cancelled++;
    if (b.status === "no_show") m.noShow++;
    const src = sourceLabel(b);
    m.sources[src] = (m.sources[src] ?? 0) + 1;
  }
  return [...map.values()].sort((a, b) => b.month.localeCompare(a.month));
}
