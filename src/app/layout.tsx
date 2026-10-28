import type { Metadata, Viewport } from "next";
import { business, services } from "@/config";
import { businessJsonLd } from "@/lib/seo";
import "./globals.css";

const siteUrl = process.env.SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `Optyk Wrocław – badanie wzroku u optometrysty, zapisy online | ${business.name}`,
  description: `Badanie wzroku i dobór okularów u optometrysty we Wrocławiu, ${business.street}. ${services[0].price ? `Badanie ${services[0].price}${services[0].priceNote ? ` (${services[0].priceNote})` : ""}. ` : ""}Wybierz termin online w minutę, potwierdzenie SMS.`,
  keywords: ["optyk Wrocław", "badanie wzroku Wrocław", "optometrysta Wrocław", "okulary Wrocław", "dobór okularów", "okulary progresywne", "Optyk Galant", "optyk Wapienna"],
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
  // Ikona i nazwa po dodaniu strony do ekranu głównego telefonu (panel ma własny manifest)
  manifest: "/site.webmanifest",
  appleWebApp: { title: business.name },
  openGraph: {
    title: `Umów badanie wzroku – ${business.name}`,
    description: `${services[0].name}. ${business.street}, ${business.city}.`,
    locale: "pl_PL",
    siteName: business.name,
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0f5c6e" };

const jsonLd = businessJsonLd(siteUrl.replace(/\/$/, ""));

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
