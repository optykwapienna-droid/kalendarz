import webpush from "web-push";
import { db } from "./db";

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };
type SubRow = { endpoint: string; p256dh: string; auth: string; seen_at: string };

type Vapid = { publicKey: string; privateKey: string };

/** Klucze VAPID trzymamy w bazie: pierwsze wywołanie je generuje, więc nie trzeba nic ustawiać w Vercelu. */
async function vapid(): Promise<Vapid> {
  const { data } = await db().from("app_keys").select("value").eq("name", "vapid").maybeSingle();
  if (data) return JSON.parse(data.value) as Vapid;
  const keys = webpush.generateVAPIDKeys();
  await db().from("app_keys").upsert({ name: "vapid", value: JSON.stringify(keys) }, { ignoreDuplicates: true });
  // Przy równoczesnym pierwszym wywołaniu wygrywa zapis, który trafił do bazy
  const { data: saved } = await db().from("app_keys").select("value").eq("name", "vapid").single();
  return JSON.parse(saved!.value) as Vapid;
}

/** Klucz publiczny VAPID dla przeglądarki; pusty, gdy baza nie ma jeszcze tabeli. */
export async function pushPublicKey(): Promise<string> {
  return vapid()
    .then((k) => k.publicKey)
    .catch(() => "");
}

export async function saveSubscription(s: PushSub): Promise<void> {
  const { error } = await db()
    .from("push_subscriptions")
    .upsert({ endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, seen_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await db().from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/** Panel otwarty na tym urządzeniu: licznik od zera. */
export async function markSeen(endpoint: string): Promise<void> {
  await db().from("push_subscriptions").update({ seen_at: new Date().toISOString() }).eq("endpoint", endpoint);
}

async function newSince(iso: string): Promise<number> {
  const { count } = await db()
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("created_by", "patient")
    .gt("created_at", iso);
  return count ?? 0;
}

/** Powiadomienie na telefony gabinetu z licznikiem nowych wizyt od ostatniego otwarcia panelu. Błędy tylko logujemy. */
export async function sendPush(title: string, body: string): Promise<void> {
  const keys = await vapid().catch(() => null);
  if (!keys) return;
  webpush.setVapidDetails("https://wizyta.ireneuszgalant.pl", keys.publicKey, keys.privateKey);
  const { data } = await db().from("push_subscriptions").select("endpoint, p256dh, auth, seen_at");
  for (const s of (data ?? []) as SubRow[]) {
    const count = await newSince(s.seen_at);
    const payload = JSON.stringify({ title, body, count });
    await webpush
      .sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
      .catch(async (e: { statusCode?: number }) => {
        // 404/410: telefon wypisał się z powiadomień
        if (e.statusCode === 404 || e.statusCode === 410) await removeSubscription(s.endpoint);
        else console.error("Błąd push:", e);
      });
  }
}
