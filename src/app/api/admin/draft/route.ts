import { NextResponse, type NextRequest } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

// Usunięcie niedokończonego zapisu z listy (np. po oddzwonieniu).
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.redirect(new URL("/panel/login", req.url), 303);
  const f = await req.formData();
  const id = String(f.get("id") ?? "");
  if (/^[0-9a-f-]{36}$/.test(id)) await db().from("booking_drafts").delete().eq("id", id);
  return NextResponse.redirect(new URL("/panel/niedokonczone", req.url), 303);
}
