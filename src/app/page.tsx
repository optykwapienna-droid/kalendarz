import { business, faq, questions, services, visitTips } from "@/config";
import { faqJsonLd } from "@/lib/seo";
import BookingForm from "./BookingForm";

export default async function Home({ searchParams }: { searchParams: Promise<{ zrodlo?: string }> }) {
  const { zrodlo } = await searchParams;
  return (
    <>
      <h1>Umów badanie wzroku we Wrocławiu</h1>
      <p className="muted">
        {business.person} · {business.name}, {business.street}, {business.city}.{" "}
        <a href={business.googleMapsUrl} target="_blank" rel="noopener">
          Jak dojechać
        </a>
      </p>
      <BookingForm services={services} questions={questions} source={zrodlo} />
      <section className="card">
        <h2>Jak przygotować się do wizyty</h2>
        <ul>
          {visitTips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <p className="muted small">
          Dzień przed wizytą wyślemy przypomnienie SMS. Wizytę możesz odwołać z linku w SMS-ie.
        </p>
      </section>
      <section className="card">
        <h2>Optyk i optometrysta we Wrocławiu</h2>
        <p>
          {business.name} to salon optyczny przy {business.street} we Wrocławiu. Badanie wzroku wykonuje optometrysta
          Ireneusz Galant: komputerowe i subiektywne badanie ostrości wzroku, dobór okularów do dali i do czytania,
          okularów progresywnych i okularów do pracy przy komputerze. Pomagamy też w wyborze oprawek, także gdy masz już
          receptę.
        </p>
      </section>
      <section className="card">
        <h2>Najczęstsze pytania</h2>
        {faq.map((f) => (
          <details key={f.q} className="faq">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }} />
    </>
  );
}
