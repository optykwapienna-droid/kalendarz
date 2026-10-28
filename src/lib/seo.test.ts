import { describe, expect, it } from "vitest";
import { businessJsonLd, faqJsonLd, phoneE164 } from "./seo";

describe("dane dla Google", () => {
  it("telefon w formacie międzynarodowym", () => {
    expect(phoneE164("502 144 394")).toBe("+48502144394");
  });
  it("wizytówka z godzinami i ceną", () => {
    const j = businessJsonLd("https://example.pl");
    expect(j.telephone).toBe("+48502144394");
    expect(j.openingHoursSpecification[0].dayOfWeek).toContain("https://schema.org/Monday");
    expect(j.makesOffer.price).toBe("200");
  });
  it("pytania i odpowiedzi", () => {
    expect(faqJsonLd().mainEntity.length).toBeGreaterThan(3);
  });
});
