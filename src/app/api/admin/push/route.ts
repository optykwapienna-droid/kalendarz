import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { markSeen, removeSubscription, saveSubscription, type PushSub } from "@/lib/push";

// Zapis telefonu do powiadomień o nowych wizytach i zerowanie licznika po otwarciu panelu.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { action?: string; subscription?: PushSub; endpoint?: string } | null;
  const sub = body?.subscription;
  const endpoint = sub?.endpoint ?? body?.endpoint ?? "";
  if (!endpoint.startsWith("https://")) return NextResponse.json({ error: "bad endpoint" }, { status: 400 });
  if (body?.action === "subscribe") {
    if (!sub?.keys?.p256dh || !sub.keys.auth) return NextResponse.json({ error: "bad keys" }, { status: 400 });
    await saveSubscription(sub);
  } else if (body?.action === "unsubscribe") await removeSubscription(endpoint);
  else await markSeen(endpoint);
  return NextResponse.json({ ok: true });
}
