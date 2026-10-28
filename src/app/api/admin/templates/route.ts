import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { SMS_DEFAULTS } from "@/lib/smsDefaults";
import { SMS_KINDS } from "@/lib/smsText";

const isId = (s: string) => /^[0-9a-f-]{36}$/.test(s);

// Zarządzanie szablonami SMS: dodanie, edycja, usunięcie i wybór domyślnego dla każdego rodzaju.
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/panel/login", req.url), 303);
  const f = await req.formData();
  const action = String(f.get("action") ?? "");
  const id = String(f.get("id") ?? "");
  const kind = String(f.get("kind") ?? "");
  const name = String(f.get("name") ?? "").trim().slice(0, 80);
  const body = String(f.get("body") ?? "").trim().slice(0, 640);

  if ((action === "add" || action === "update") && kind in SMS_KINDS && name && body) {
    if (action === "add") {
      await db().from("sms_templates").insert({ kind, name, body });
    } else if (isId(id)) {
      // Po zmianie rodzaju szablon przestaje być domyślny (w nowym rodzaju może już być inny domyślny)
      const { data: cur } = await db().from("sms_templates").select("kind").eq("id", id).maybeSingle();
      const reset = cur && cur.kind !== kind ? { is_default: false } : {};
      await db().from("sms_templates").update({ kind, name, body, ...reset }).eq("id", id);
    }
  } else if (action === "load_defaults") {
    const { data: all } = await db().from("sms_templates").select("id, name");
    for (const t of SMS_DEFAULTS) {
      const cur = (all ?? []).find((r) => r.name === t.name);
      if (cur) await db().from("sms_templates").update({ kind: t.kind, body: t.body, is_default: false }).eq("id", cur.id);
      else await db().from("sms_templates").insert({ kind: t.kind, name: t.name, body: t.body });
    }
    for (const t of SMS_DEFAULTS.filter((d) => d.isDefault)) {
      await db().from("sms_templates").update({ is_default: false }).eq("kind", t.kind).eq("is_default", true);
      await db().from("sms_templates").update({ is_default: true }).eq("name", t.name).eq("kind", t.kind);
    }
  } else if (action === "delete" && isId(id)) {
    await db().from("sms_templates").delete().eq("id", id);
  } else if (action === "default" && kind in SMS_KINDS) {
    // Pusta wartość wyłącza automatyczną wysyłkę dla tego rodzaju
    await db().from("sms_templates").update({ is_default: false }).eq("kind", kind).eq("is_default", true);
    if (isId(id)) await db().from("sms_templates").update({ is_default: true }).eq("id", id).eq("kind", kind);
  }
  return NextResponse.redirect(new URL("/panel/sms", req.url), 303);
}
