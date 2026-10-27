import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, checkPassword, newSession, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  if (!checkPassword(String(form.get("password") ?? ""))) {
    // Krótkie opóźnienie utrudnia zgadywanie hasła
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.redirect(new URL("/panel/login?blad=1", req.url), 303);
  }
  const res = NextResponse.redirect(new URL("/panel", req.url), 303);
  res.cookies.set(SESSION_COOKIE, newSession(), sessionCookieOptions);
  return res;
}
