import { describe, expect, it } from "vitest";
import { smsParts } from "./smsText";
import { voucherText } from "./vouchers";

describe("SMS z voucherem", () => {
  it("ma link, zwrot i mieści się w 2 częściach", () => {
    process.env.SITE_URL = "https://wizyta.ireneuszgalant.pl";
    const t = voucherText("50", "Anna");
    expect(t).toContain("Pani voucher -50% na soczewki recepturowe");
    expect(t).toContain("https://wizyta.ireneuszgalant.pl/voucher-50");
    expect(smsParts(t)).toBeLessThanOrEqual(3);
  });
});
