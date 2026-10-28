import Voucher, { voucherMetadata, voucherViewport, type VoucherConfig } from "../_voucher/Voucher";

const v: VoucherConfig = {
  path: "/voucher-20",
  image: { src: "/voucher-20.png", width: 766, height: 1032 },
  title: "-20% na soczewki okularowe",
  promo: "Kompletna para okularów od 200 zł",
  source: "voucher20",
};

export const metadata = voucherMetadata(v);
export const viewport = voucherViewport;

export default function Voucher20Page() {
  return <Voucher v={v} />;
}
