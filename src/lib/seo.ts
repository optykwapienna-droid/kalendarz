// Dane strukturalne (schema.org) dla Google: wizytówka gabinetu i najczęstsze pytania.
import { business, faq, services } from "@/config";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** „502 144 394” -> „+48502144394”. */
export function phoneE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 9 ? `+48${digits}` : `+${digits}`;
}

/** „200 zł” -> „200”. */
function priceValue(price?: string): string | undefined {
  return price?.match(/\d+(?:[.,]\d+)?/)?.[0].replace(",", ".");
}

export function businessJsonLd(siteUrl: string) {
  const s = services[0];
  const price = priceValue(s.price);
  return {
    "@context": "https://schema.org",
    "@type": ["Optician", "MedicalBusiness"],
    "@id": `${siteUrl}/#gabinet`,
    name: business.name,
    description: `${s.name} we Wrocławiu. Optometrysta ${business.person.split(",")[0]}, zapisy online.`,
    url: siteUrl,
    ...(business.phone ? { telephone: phoneE164(business.phone) } : {}),
    ...(business.email ? { email: business.email } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: business.street.replace(/^ul\.\s*/, ""),
      addressLocality: business.city,
      ...(business.postalCode ? { postalCode: business.postalCode } : {}),
      addressCountry: "PL",
    },
    hasMap: business.googleMapsUrl,
    areaServed: { "@type": "City", name: business.city },
    ...(s.price ? { priceRange: s.price } : {}),
    currenciesAccepted: "PLN",
    openingHoursSpecification: business.shopHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days.map((d) => `https://schema.org/${DAYS[d]}`),
      opens: h.from,
      closes: h.to,
    })),
    employee: { "@type": "Person", name: "Ireneusz Galant", jobTitle: "Optometrysta" },
    knowsAbout: ["badanie wzroku", "dobór okularów", "okulary progresywne", "okulary do komputera", "soczewki kontaktowe"],
    makesOffer: {
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name, description: s.description, provider: { "@id": `${siteUrl}/#gabinet` } },
      ...(price ? { price, priceCurrency: "PLN" } : {}),
      ...(s.priceNote ? { description: s.priceNote } : {}),
    },
    potentialAction: {
      "@type": "ReserveAction",
      target: { "@type": "EntryPoint", urlTemplate: siteUrl, actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"] },
      result: { "@type": "Reservation", name: s.name },
    },
  };
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
