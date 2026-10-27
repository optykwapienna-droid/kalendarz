import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type BookingRow = {
  id: string;
  service_id: string;
  starts_at: string;
  ends_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  answers: Record<string, string | string[]>;
  privacy_accepted_at: string | null;
  created_by: "patient" | "panel";
  source: string | null;
  status: "confirmed" | "cancelled" | "no_show";
  cancel_token: string;
  google_event_id: string | null;
  confirmation_sent_at: string | null;
  reminder_sent_at: string | null;
  thanks_sent_at: string | null;
  created_at: string;
};

export type BlockRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  note: string | null;
};

export type SmsKind = "confirmation" | "reminder" | "thanks" | "other";

export type TemplateRow = {
  id: string;
  kind: SmsKind;
  name: string;
  body: string;
  is_default: boolean;
};

export type SmsLogRow = {
  id: string;
  booking_id: string;
  kind: string;
  body: string;
  error: string | null;
  sent_at: string;
};

let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Brak SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY");
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
