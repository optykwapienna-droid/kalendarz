import { createVerify, generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

describe("Kalendarz Google", () => {
  const calls: { url: string; init?: RequestInit }[] = [];

  beforeEach(() => {
    vi.resetModules();
    calls.length = 0;
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = "rezerwacje@projekt.iam.gserviceaccount.com";
    process.env.GOOGLE_PRIVATE_KEY = privateKey.export({ type: "pkcs8", format: "pem" }).toString().replace(/\n/g, "\\n");
    process.env.GOOGLE_CALENDAR_ID = "gabinet@gmail.com";
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.includes("oauth2")) return Response.json({ access_token: "tok", expires_in: 3600 });
      if (url.includes("freeBusy"))
        return Response.json({
          calendars: { "gabinet@gmail.com": { busy: [{ start: "2026-11-03T11:00:00Z", end: "2026-11-03T12:00:00Z" }] } },
        });
      if (init?.method === "DELETE") return new Response(null, { status: 410 });
      return Response.json({ id: "ev123" });
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("podpisuje token i tworzy wydarzenie z identyfikatorem wizyty", async () => {
    const g = await import("./google");
    const id = await g.createEvent({
      bookingId: "b1",
      start: new Date("2026-11-03T09:00:00Z"),
      end: new Date("2026-11-03T10:00:00Z"),
      summary: "Jan Kowalski – Badanie",
      description: "Telefon: +48600100200",
    });
    expect(id).toBe("ev123");

    const assertion = new URLSearchParams(String(calls[0].init!.body)).get("assertion")!;
    const [h, p, s] = assertion.split(".");
    expect(createVerify("RSA-SHA256").update(`${h}.${p}`).verify(publicKey, Buffer.from(s, "base64url"))).toBe(true);
    expect(JSON.parse(Buffer.from(p, "base64url").toString()).iss).toBe("rezerwacje@projekt.iam.gserviceaccount.com");

    expect(calls[1].url).toBe("https://www.googleapis.com/calendar/v3/calendars/gabinet%40gmail.com/events");
    const body = JSON.parse(String(calls[1].init!.body));
    expect(body.extendedProperties.private).toEqual({ app: "optyk-rezerwacje", bookingId: "b1" });
    expect((calls[1].init!.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("odczytuje zajęte terminy i toleruje usunięte już wydarzenie", async () => {
    const g = await import("./google");
    const busy = await g.googleBusy(new Date("2026-11-03T00:00:00Z"), new Date("2026-11-04T00:00:00Z"));
    expect(busy).toEqual([{ start: new Date("2026-11-03T11:00:00Z"), end: new Date("2026-11-03T12:00:00Z") }]);
    await expect(g.deleteEvent("ev123")).resolves.toBeUndefined();
  });

  it("bez konfiguracji nic nie robi", async () => {
    delete process.env.GOOGLE_CALENDAR_ID;
    const g = await import("./google");
    expect(g.googleEnabled()).toBe(false);
    expect(await g.createEvent({ bookingId: "b", start: new Date(), end: new Date(), summary: "", description: "" })).toBeNull();
    expect(calls).toHaveLength(0);
  });
});

describe("normalizePrivateKey", async () => {
  const pem = "-----BEGIN PRIVATE KEY-----\nABCDEF\n-----END PRIVATE KEY-----";
  const escaped = "-----BEGIN PRIVATE KEY-----\\nABC\\nDEF\\n-----END PRIVATE KEY-----\\n";

  it("zamienia \\n na nowe linie", async () => {
    expect((await import("./google")).normalizePrivateKey(escaped)).toBe(pem);
  });
  it("usuwa cudzysłowy, przecinek i spacje", async () => {
    expect((await import("./google")).normalizePrivateKey(`  "${escaped}",  `)).toBe(pem);
  });
  it("przyjmuje wklejone z nazwą pola", async () => {
    expect((await import("./google")).normalizePrivateKey(`"private_key": "${escaped}",`)).toBe(pem);
  });
  it("przyjmuje cały plik JSON", async () => {
    expect((await import("./google")).normalizePrivateKey(JSON.stringify({ type: "service_account", private_key: pem + "\n" }))).toBe(pem);
  });
  it("pusty klucz to brak klucza", async () => {
    expect((await import("./google")).normalizePrivateKey("  ")).toBeUndefined();
    expect((await import("./google")).normalizePrivateKey(undefined)).toBeUndefined();
  });
});

describe("describeKey", () => {
  it("opisuje ucięty klucz bez ujawniania treści", async () => {
    const { describeKey } = await import("./google");
    const d = describeKey("-----BEGIN PRIVATE KEY-----\nSEKRET");
    expect(d).toContain("brak END");
    expect(d).not.toContain("SEKRET");
  });
});

describe("normalizePrivateKey z prawdziwym kluczem", () => {
  it("naprawia klucz, w którym nowe linie zamieniły się w spacje", async () => {
    const { normalizePrivateKey } = await import("./google");
    const { createPrivateKey, generateKeyPairSync: gen } = await import("node:crypto");
    const pem = gen("rsa", { modulusLength: 1024 }).privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    const broken = pem.replace(/\n/g, " ");
    expect(() => createPrivateKey(broken)).toThrow();
    expect(() => createPrivateKey(normalizePrivateKey(broken)!)).not.toThrow();
    expect(() => createPrivateKey(normalizePrivateKey(JSON.stringify({ private_key: pem }))!)).not.toThrow();
  });
});
