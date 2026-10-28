import { NextResponse, type NextRequest } from "next/server";
import { canPatientCancel, findByToken, setStatus } from "@/lib/bookings";
import { notifyAdmin } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const token = String(form.get("t") ?? "");
  const b = await findByToken(token);
  if (b && canPatientCancel(b)) {
    await setStatus(b, "cancelled");
    await notifyAdmin("cancelled", b);
  }
  return NextResponse.redirect(new URL(`/o/${encodeURIComponent(token)}`, req.url), 303);
}
