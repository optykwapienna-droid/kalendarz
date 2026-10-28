import Voucher, { voucherMetadata, voucherViewport, type VoucherConfig } from "../_voucher/Voucher";

const v: VoucherConfig = {
  path: "/voucher-50",
  image: { src: "/voucher-50.png", width: 813, height: 1032 },
  title: "-50% na soczewki recepturowe",
  source: "voucher50",
};

export const metadata = voucherMetadata(v);
export const viewport = voucherViewport;

export default function Voucher50Page() {
  return <Voucher v={v} />;
}
