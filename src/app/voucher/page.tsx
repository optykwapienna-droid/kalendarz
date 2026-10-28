import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import { business } from "@/config";
import { phoneE164 } from "@/lib/seo";
import FullscreenButton from "./FullscreenButton";

// Voucher do wysyłania wybranym klientom (SMS, Messenger, WhatsApp). Nie jest indeksowany w Google.
// Otwiera się na cały ekran telefonu, bez nagłówka i stopki strony zapisów.
export const metadata: Metadata = {
  title: `Voucher -20% na soczewki okularowe | ${business.name}`,
  description: `Rabat 20% na soczewki okularowe w ${business.name}, ${business.street}, ${business.city}. Kompletna para okularów od 200 zł.`,
  robots: { index: false },
  alternates: { canonical: "/voucher" },
  openGraph: {
    title: `Voucher -20% na soczewki okularowe – ${business.name}`,
    description: `Kompletna para okularów od 200 zł. ${business.street}, ${business.city}.`,
    images: [{ url: "/voucher.png", width: 766, height: 1032, alt: "Voucher -20% na soczewki okularowe" }],
  },
};

export const viewport: Viewport = { themeColor: "#e9eff4", viewportFit: "cover" };

// Grafika z Canvy (bez przycisków, te są prawdziwe poniżej). Bez pliku pokazujemy wersję tekstową.
const IMAGE = "/voucher.png";
const hasImage = existsSync(path.join(process.cwd(), "public", IMAGE));

export default function VoucherPage() {
  return (
    <section className="voucher-full">
      <FullscreenButton />
      <div className="voucher">
        {hasImage ? (
          <>
            <img className="voucher-img" src={IMAGE} alt="Voucher -20% na soczewki okularowe. Optyk Galant, ul. Wapienna 20, Wrocław." />
            <p className="voucher-promo">Kompletna para okularów od 200 zł</p>
          </>
        ) : (
          <>
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
          </>
        )}
        <div className="voucher-actions">
          <a className="btn" href="/?zrodlo=voucher">
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
