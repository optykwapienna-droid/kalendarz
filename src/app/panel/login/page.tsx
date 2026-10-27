import type { Metadata } from "next";

export const metadata: Metadata = { title: "Logowanie do panelu", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ blad?: string }> }) {
  const { blad } = await searchParams;
  return (
    <section className="card" style={{ maxWidth: 380, margin: "40px auto" }}>
      <h1 style={{ marginTop: 0 }}>Panel gabinetu</h1>
      {blad && <div className="alert error">Nieprawidłowe hasło.</div>}
      <form method="post" action="/api/admin/login">
        <label htmlFor="password">Hasło</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
        <button className="btn" type="submit" style={{ marginTop: 16 }}>
          Zaloguj
        </button>
      </form>
    </section>
  );
}
