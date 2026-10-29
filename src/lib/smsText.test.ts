import { describe, expect, it } from "vitest";
import { renderSms, smsParts, toGsm } from "./smsText";
import { SMS_DEFAULTS } from "./smsDefaults";

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
      "Lucja Zolc: 03.11 o 10:00, ul. Wapienna 20. https://rezerwacje.optykwapienna.pl/o/AbCdEfGhIjKlMnOp {nieznane}",
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

  it("SMS z emotikonami zachowuje polskie znaki i liczy części jak Unicode", () => {
    const t = renderSms("✅ {imie}, {dzien}", ctx);
    expect(t).toBe("✅ Łucja, wtorek, 3 listopada");
    expect(smsParts("✅" + "a".repeat(69))).toBe(1);
    expect(smsParts("📅" + "a".repeat(69))).toBe(2);
    expect(smsParts("ą".repeat(160))).toBe(1);
  });

  it("{zmiana} prowadzi prosto do wyboru nowego terminu", () => {
    expect(renderSms("{zmiana}", ctx)).toBe(`${ctx.link}/zmien`);
  });
});

describe("wzory SMS z linkiem", () => {
  it("mieszczą się w 1 SMS bez emotikonów", () => {
    const long = { ...ctx, start: new Date("2026-10-28T09:00:00Z"), link: "https://wizyta.ireneuszgalant.pl/o/cyQ4_ELFpSJ-3R5D" };
    for (const t of SMS_DEFAULTS.filter((d) => d.body.includes("{link}"))) {
      const text = renderSms(t.body, long);
      expect(smsParts(text)).toBe(1);
    }
  });
});
