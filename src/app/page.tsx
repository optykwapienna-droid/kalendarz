import { business, questions, services, visitTips } from "@/config";
import BookingForm from "./BookingForm";

export default async function Home({ searchParams }: { searchParams: Promise<{ zrodlo?: string }> }) {
  const { zrodlo } = await searchParams;
  return (
    <>
      <h1>Umów badanie wzroku</h1>
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
    </>
  );
}
