import { NextResponse, type NextRequest } from "next/server";
import { saveDraft } from "@/lib/drafts";

// Formularz zapisuje tu dane, zanim pacjent kliknie „Rezerwuję wizytę”, żeby gabinet mógł
// oddzwonić, gdy zapis zostanie przerwany. Błędy tylko logujemy, pacjent ich nie widzi.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const saved = await saveDraft(body).catch((e) => (console.error("Szkic rezerwacji:", e), false));
  return NextResponse.json({ saved });
}
