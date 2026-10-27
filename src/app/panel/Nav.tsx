export default function Nav({ active }: { active: "wizyty" | "kalendarz" | "sms" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 20 }}>
      <nav style={{ display: "flex", gap: 8 }}>
        <a className={`btn small${active === "wizyty" ? "" : " secondary"}`} href="/panel">
          Wizyty
        </a>
        <a className={`btn small${active === "kalendarz" ? "" : " secondary"}`} href="/panel/kalendarz">
          Kalendarz
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
