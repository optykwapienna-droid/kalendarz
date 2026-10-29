import { describe, expect, it } from "vitest";
import { renderSms, smsParts, toGsm } from "./smsText";
import { SMS_DEFAULTS } from "./smsDefaults";
import { INVITE_SMS, VOUCHER_SMS } from "./vouchers";

const ctx = {
  firstName: "Łucja",
  lastName: "Żółć",
  start: new Date("2026-11-03T09:00:00Z"), // 10:00 w Polsce
  link: "https://rezerwacje.optykwapienna.pl/o/AbCdEfGhIjKlMnOp",
};

describe("SMS", () => {
  it("usuwa polskie znaki", () => {
    expect(toGsm("Zażółć gęślą jaźń – „Łódź”")).toBe('Zazolc gesla jazn - "Lodz"');
  });

  it("wstawia pola do szablonu", () => {
    expect(renderSms("{imie} {nazwisko}: {data} o {godzina}, {adres}. {link} {nieznane}", ctx)).toBe(
      "Łucja Żółć: 03.11 o 10:00, ul. Wapienna 20. https://rezerwacje.optykwapienna.pl/o/AbCdEfGhIjKlMnOp {nieznane}",
    );
  });

  it("liczy części SMS", () => {
    expect(smsParts("a".repeat(160))).toBe(1);
    expect(smsParts("a".repeat(161))).toBe(2);
    expect(smsParts("a".repeat(306))).toBe(2);
    expect(smsParts("a".repeat(307))).toBe(3);
  });

  it("domyślne szablony mieszczą się w 1 SMS", () => {
    const templates = [
      "Optyk Wapienna: potwierdzamy wizyte {data} o {godzina}, {adres}. Odwolanie: {link}",
      "Optyk Wapienna: przypominamy o wizycie jutro o {godzina}, {adres}. Odwolanie: {link}",
      "Dziekujemy za wizyte w Optyk Wapienna! W razie pytan o okulary jestesmy do dyspozycji. Pozdrawiamy, Ireneusz Galant",
    ];
    for (const t of templates) expect(smsParts(renderSms(t, ctx))).toBe(1);
  });

  it("zachowuje polskie znaki i liczy części jak Unicode", () => {
    const t = renderSms("✅ {imie}, {dzien}", ctx);
    expect(t).toBe("✅ Łucja, wtorek, 3 listopada");
    expect(smsParts("✅" + "a".repeat(69))).toBe(1);
    expect(smsParts("📅" + "a".repeat(69))).toBe(2);
    expect(smsParts("ą".repeat(70))).toBe(1);
    expect(smsParts("ą".repeat(71))).toBe(2);
  });

  it("{zmiana} prowadzi prosto do wyboru nowego terminu", () => {
    expect(renderSms("{zmiana}", ctx)).toBe(`${ctx.link}/zmien`);
  });
});

describe("wzory SMS", () => {
  it("są krótkie, bez pustych linii i bez 📅 (telefony pokazują go jako kartkę z datą)", () => {
    const long = { ...ctx, start: new Date("2026-10-28T09:00:00Z"), link: "https://wizyta.ireneuszgalant.pl/o/cyQ4_ELFpSJ-3R5D" };
    for (const body of [...SMS_DEFAULTS.map((d) => d.body), VOUCHER_SMS, INVITE_SMS]) {
      const text = renderSms(body, long);
      expect(text).not.toContain("📅");
      expect(text).not.toContain("\n\n");
      expect(smsParts(text)).toBeLessThanOrEqual(3);
    }
  });
});
