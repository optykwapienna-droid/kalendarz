import type { Metadata, Viewport } from "next";
import { business } from "@/config";
import { phoneE164 } from "@/lib/seo";
import FullscreenButton from "./FullscreenButton";

// Vouchery do wysyłania wybranym klientom (SMS, Messenger, WhatsApp). Nie są indeksowane w Google.
// Grafika z Canvy (przycięta, bez narysowanych przycisków), pod nią prawdziwe przyciski.
// Otwierają się na cały ekran telefonu, bez nagłówka i stopki strony zapisów.
export type VoucherConfig = {
  path: string;
  image: { src: string; width: number; height: number };
  title: string; // np. „-20% na soczewki okularowe”
  promo?: string;
  source: string; // ?zrodlo=… w linku do rezerwacji (widać w Statystykach)
};

export const voucherViewport: Viewport = { themeColor: "#e9eff4", viewportFit: "cover" };

export function voucherMetadata(v: VoucherConfig): Metadata {
  return {
    title: `Voucher ${v.title} | ${business.name}`,
    description: `Voucher ${v.title} w ${business.name}, ${business.street}, ${business.city}.${v.promo ? ` ${v.promo}.` : ""}`,
    robots: { index: false },
    alternates: { canonical: v.path },
    openGraph: {
      title: `Voucher ${v.title} – ${business.name}`,
      description: `${v.promo ? `${v.promo}. ` : ""}${business.street}, ${business.city}.`,
      images: [{ ...v.image, url: v.image.src, alt: `Voucher ${v.title}` }],
    },
  };
}

export default function Voucher({ v }: { v: VoucherConfig }) {
  return (
    <section className="voucher-full">
      <FullscreenButton />
      <div className="voucher">
        <img
          className="voucher-img"
          src={v.image.src}
          width={v.image.width}
          height={v.image.height}
          alt={`Voucher ${v.title}. ${business.name}, ${business.street}, ${business.city}.`}
        />
        {v.promo && <p className="voucher-promo">{v.promo}</p>}
        <div className="voucher-actions">
          <a className="btn" href={`/?zrodlo=${v.source}`}>
            📅 Zarezerwuj termin wizyty
          </a>
          <a className="btn secondary" href={business.googleMapsUrl} target="_blank" rel="noopener">
            📍 Jak dojechać ({business.street.replace(/^ul\.\s*/, "")})
          </a>
          <a className="btn secondary" href={`tel:${phoneE164(business.phone)}`}>
            📞 Zadzwoń do salonu
          </a>
        </div>
        <p className="voucher-note">Pokaż ten voucher w salonie przy zamówieniu okularów.</p>
      </div>
    </section>
  );
}
