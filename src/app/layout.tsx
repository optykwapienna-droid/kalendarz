import type { Metadata, Viewport } from "next";
import { business, services } from "@/config";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `Badanie wzroku Wrocław – zapisy online | ${business.name}`,
  description: `Umów badanie wzroku i dobór okularów u optometrysty. ${business.name}, ${business.street}, ${business.city}. Wybierz termin online w minutę.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: `Umów badanie wzroku – ${business.name}`,
    description: `${services[0].name}. ${business.street}, ${business.city}.`,
    locale: "pl_PL",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0f5c6e" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Optician",
  name: business.name,
  url: siteUrl,
  ...(business.phone ? { telephone: business.phone } : {}),
  address: {
    "@type": "PostalAddress",
    streetAddress: business.street.replace(/^ul\.\s*/, ""),
    addressLocality: business.city,
    ...(business.postalCode ? { postalCode: business.postalCode } : {}),
    addressCountry: "PL",
  },
  employee: { "@type": "Person", name: "Ireneusz Galant", jobTitle: "Optometrysta" },
  potentialAction: { "@type": "ReserveAction", target: siteUrl },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <header className="site-header">
          <div className="wrap">
            <a href="/" className="brand">
              {business.name}
            </a>
            <span className="muted">
              {business.street}, {business.city}
            </span>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site-footer wrap">
          <span>
            {business.name} · {business.street}, {business.city}
            {business.phone && <> · tel. {business.phone}</>}
          </span>
          <a href="/polityka-prywatnosci">Polityka prywatności</a>
        </footer>
      </body>
    </html>
  );
}
