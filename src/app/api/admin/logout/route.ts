import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL("/panel/login", req.url), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
