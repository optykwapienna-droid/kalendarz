export default function Nav({ active }: { active: "wizyty" | "kalendarz" | "statystyki" | "niedokonczone" | "vouchery" | "sms" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 20 }}>
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a className={`btn small${active === "wizyty" ? "" : " secondary"}`} href="/panel">
          Wizyty
        </a>
        <a className={`btn small${active === "kalendarz" ? "" : " secondary"}`} href="/panel/kalendarz">
          Kalendarz
        </a>
        <a className={`btn small${active === "statystyki" ? "" : " secondary"}`} href="/panel/statystyki">
          Statystyki
        </a>
        <a className={`btn small${active === "niedokonczone" ? "" : " secondary"}`} href="/panel/niedokonczone">
          Niedokończone
        </a>
        <a className={`btn small${active === "vouchery" ? "" : " secondary"}`} href="/panel/vouchery">
          Vouchery
        </a>
        <a className={`btn small${active === "sms" ? "" : " secondary"}`} href="/panel/sms">
          Szablony SMS
        </a>
      </nav>
      <form method="post" action="/api/admin/logout">
        <button className="btn secondary small">Wyloguj</button>
      </form>
    </div>
  );
}
