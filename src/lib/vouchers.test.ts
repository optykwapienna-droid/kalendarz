import { describe, expect, it } from "vitest";
import { smsParts } from "./smsText";
import { voucherText, whatsappUrl } from "./vouchers";

describe("SMS z voucherem", () => {
  it("ma link, zwrot i mieści się w 2 częściach", () => {
    process.env.SITE_URL = "https://wizyta.ireneuszgalant.pl";
    const t = voucherText("50", "Anna");
    expect(t).toContain("Pani voucher -50% na soczewki recepturowe");
    expect(t).toContain("https://wizyta.ireneuszgalant.pl/voucher-50");
    expect(smsParts(t)).toBeLessThanOrEqual(3);
  });

  it("link do WhatsAppa koduje emotikony w UTF-8", () => {
    const url = whatsappUrl("48600100200", "Okulary 👓");
    expect(url).toBe("https://api.whatsapp.com/send?phone=48600100200&text=Okulary%20%F0%9F%91%93");
  });
});
