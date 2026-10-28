import { permanentRedirect } from "next/navigation";

// Stary adres vouchera -20% (linki już wysłane klientom)
export default function OldVoucher() {
  permanentRedirect("/voucher-20");
}
