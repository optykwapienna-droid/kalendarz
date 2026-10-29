import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendSms, smsProvider } from "./smsGateway";

const ENV = ["SMSGATE_URL", "SMSGATE_USER", "SMSGATE_PASSWORD", "SMSAPI_TOKEN"];

describe("wysyłka SMS", () => {
  const calls: { url: string; init: RequestInit }[] = [];
  let status = 202;

  beforeEach(() => {
    calls.length = 0;
    status = 202;
    for (const k of ENV) delete process.env[k];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ id: "m1", status: "queued" }), { status });
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("bez konfiguracji tylko loguje", async () => {
    expect(smsProvider()).toBe("none");
    await sendSms("48600100200", "test");
    expect(calls).toHaveLength(0);
  });

  it("wysyła przez telefon (SMS Gate, chmura)", async () => {
    process.env.SMSGATE_USER = "abc";
    process.env.SMSGATE_PASSWORD = "xyz";
    process.env.SMSAPI_TOKEN = "nieuzywany";
    expect(smsProvider()).toBe("smsgate");
    await sendSms("48600100200", "Zażółć o 10:00");
    expect(calls[0].url).toBe("https://api.sms-gate.app/3rdparty/v1/messages");
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("abc:xyz").toString("base64")}`,
    );
    expect(JSON.parse(String(calls[0].init.body))).toEqual({
      textMessage: { text: "Zażółć o 10:00" },
      phoneNumbers: ["+48600100200"],
      ttl: 43200,
    });
  });

  it("obsługuje serwer lokalny lub własny", async () => {
    process.env.SMSGATE_URL = "https://sms.example.pl/api/";
    process.env.SMSGATE_USER = "abc";
    process.env.SMSGATE_PASSWORD = "xyz";
    await sendSms("48600100200", "x");
    expect(calls[0].url).toBe("https://sms.example.pl/api/3rdparty/v1/messages");
  });

  it("zgłasza błąd, gdy bramka odrzuci SMS", async () => {
    process.env.SMSGATE_USER = "abc";
    process.env.SMSGATE_PASSWORD = "zle";
    status = 401;
    await expect(sendSms("48600100200", "x")).rejects.toThrow("SMS Gate: 401");
  });

  it("SMSAPI nadal działa jako alternatywa", async () => {
    process.env.SMSAPI_TOKEN = "tok";
    status = 200;
    await sendSms("48600100200", "x");
    expect(calls[0].url).toBe("https://api.smsapi.pl/sms.do");
  });
});
