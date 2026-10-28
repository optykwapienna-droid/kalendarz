import type { Metadata } from "next";
import { business } from "@/config";
import { phoneE164 } from "@/lib/seo";

// Voucher do wysyłania wybranym klientom (SMS, Messenger, WhatsApp). Nie jest indeksowany w Google.
export const metadata: Metadata = {
  title: `Voucher -20% na soczewki okularowe | ${business.name}`,
  description: `Rabat 20% na soczewki okularowe w ${business.name}, ${business.street}, ${business.city}. Kompletna para okularów od 200 zł.`,
  robots: { index: false },
  alternates: { canonical: "/voucher" },
  openGraph: {
    title: `Voucher -20% na soczewki okularowe – ${business.name}`,
    description: `Kompletna para okularów od 200 zł. ${business.street}, ${business.city}.`,
  },
};

export default function VoucherPage() {
  return (
    <section className="voucher">
      <p className="voucher-label">Voucher</p>
      <p className="voucher-value">-20%</p>
      <p className="voucher-what">na soczewki okularowe</p>
      <p className="voucher-promo">Kompletna para okularów od 200 zł</p>
      <div className="voucher-line" />
      <p className="voucher-name">{business.name}</p>
      <p className="voucher-addr">
        {business.street}
        <br />
        {business.postalCode} {business.city}
      </p>
      <div className="voucher-actions">
        <a className="btn" href="/?zrodlo=voucher">
          📅 Zarezerwuj termin wizyty
        </a>
        <a className="btn secondary" href={business.googleMapsUrl} target="_blank" rel="noopener">
          📍 Jak dojechać
        </a>
        <a className="btn secondary" href={`tel:${phoneE164(business.phone)}`}>
          📞 Zadzwoń: {business.phone}
        </a>
      </div>
      <p className="voucher-note">Pokaż ten voucher w salonie przy zamówieniu okularów.</p>
    </section>
  );
}
