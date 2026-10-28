import { services } from "@/config";
import { db } from "./db";
import { normalizePhone } from "./validate";

/** Niedokończony zapis: pacjent wpisał telefon, ale nie kliknął „Rezerwuję wizytę”. */
export type DraftRow = {
  id: string;
  session_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string;
  service_id: string | null;
  starts_at: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
};

/** Ile dni trzymamy niedokończone zapisy (tyle też obiecujemy w formularzu). */
export const DRAFT_DAYS = 7;

const text = (v: unknown, max: number) => {
  const s = String(v ?? "").trim().slice(0, max);
  return s || null;
};

/** Zapisuje lub aktualizuje szkic z formularza. Bez poprawnego telefonu nic nie zapisuje. */
export async function saveDraft(body: unknown): Promise<boolean> {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (b.website) return false;
  const sid = String(b.sid ?? "");
  if (!/^[\w-]{16,64}$/.test(sid)) return false;
  const phone = normalizePhone(String(b.phone ?? ""));
  if (!phone) return false;
  const start = new Date(String(b.start ?? ""));
  const { error } = await db()
    .from("booking_drafts")
    .upsert(
      {
        session_id: sid,
        first_name: text(b.firstName, 60),
        last_name: text(b.lastName, 60),
        phone,
        service_id: services.some((s) => s.id === b.serviceId) ? String(b.serviceId) : null,
        starts_at: Number.isNaN(start.getTime()) ? null : start.toISOString(),
        source: text(b.source, 40),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" },
    );
  if (error) throw error;
  return true;
}

export async function listDrafts(): Promise<DraftRow[]> {
  const { data, error } = await db().from("booking_drafts").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return data as DraftRow[];
}

/** Po udanej rezerwacji szkice z tym numerem nie są już potrzebne. */
export async function dropDraftsFor(phone: string): Promise<void> {
  const { error } = await db().from("booking_drafts").delete().eq("phone", phone);
  if (error) console.error("Nie udało się usunąć szkicu rezerwacji:", error);
}

export async function purgeOldDrafts(now = new Date()): Promise<void> {
  const cutoff = new Date(now.getTime() - DRAFT_DAYS * 86400000).toISOString();
  const { error } = await db().from("booking_drafts").delete().lt("updated_at", cutoff);
  if (error) console.error("Nie udało się usunąć starych szkiców:", error);
}
