import Voucher, { voucherMetadata, voucherViewport, type VoucherConfig } from "./Voucher";

const v: VoucherConfig = {
  path: "/voucher",
  image: { src: "/voucher.png", width: 766, height: 1032 },
  title: "-20% na soczewki okularowe",
  promo: "Kompletna para okularów od 200 zł",
  source: "voucher",
};

export const metadata = voucherMetadata(v);
export const viewport = voucherViewport;

export default function VoucherPage() {
  return <Voucher v={v} />;
}
