import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import type { SmsKind, TemplateRow } from "@/lib/db";
import { listTemplates } from "@/lib/sms";
import { PLACEHOLDERS, SMS_KINDS, renderSms, smsParts } from "@/lib/smsText";
import Nav from "../Nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Szablony SMS", robots: { index: false } };

const AUTO: SmsKind[] = ["confirmation", "reminder", "thanks"];

// Przykładowe dane do podglądu długości SMS-a
const sample = {
  firstName: "Katarzyna",
  lastName: "Nowak",
  start: new Date("2026-11-03T09:00:00Z"),
  link: `${(process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "")}/o/AbCdEfGhIjKlMnOp`,
};

function KindSelect({ name, value }: { name: string; value: SmsKind }) {
  return (
    <select name={name} defaultValue={value}>
      {(Object.keys(SMS_KINDS) as SmsKind[]).map((k) => (
        <option key={k} value={k}>
          {SMS_KINDS[k]}
        </option>
      ))}
    </select>
  );
}

function Template({ t }: { t: TemplateRow }) {
  const preview = renderSms(t.body, sample);
  const parts = smsParts(preview);
  return (
    <div className="card" style={{ margin: "12px 0", padding: 14 }}>
      <form method="post" action="/api/admin/templates">
        <input type="hidden" name="action" value="update" />
        <input type="hidden" name="id" value={t.id} />
        <div className="row">
          <div>
            <label>Nazwa</label>
            <input name="name" type="text" defaultValue={t.name} required maxLength={80} />
          </div>
          <div>
            <label>Rodzaj</label>
            <KindSelect name="kind" value={t.kind} />
          </div>
        </div>
        <label>Treść</label>
        <textarea name="body" defaultValue={t.body} required maxLength={640} />
        <p className="small muted">
          Podgląd ({preview.length} znaków, {parts} {parts === 1 ? "SMS" : "SMS-y"}): {preview}
        </p>
        <div className="actions">
          <button className="btn small">Zapisz</button>
        </div>
      </form>
      <form method="post" action="/api/admin/templates" style={{ marginTop: 8 }}>
        <input type="hidden" name="action" value="delete" />
        <input type="hidden" name="id" value={t.id} />
        <button className="btn danger small">Usuń szablon</button>
      </form>
    </div>
  );
}

export default async function SmsTemplates() {
  if (!(await isAdmin())) redirect("/panel/login");
  const templates = await listTemplates();

  return (
    <>
      <Nav active="sms" />

      <section className="card">
        <h2>Wysyłane automatycznie</h2>
        <p className="small muted" style={{ marginTop: -6 }}>
          Wybierz z menu, który szablon ma wychodzić. „Nie wysyłaj” wyłącza dany SMS.
        </p>
        {AUTO.map((k) => {
          const list = templates.filter((t) => t.kind === k);
          const current = list.find((t) => t.is_default)?.id ?? "";
          return (
            <form key={k} method="post" action="/api/admin/templates" className="row" style={{ marginBottom: 12 }}>
              <input type="hidden" name="action" value="default" />
              <input type="hidden" name="kind" value={k} />
              <div>
                <label>{SMS_KINDS[k]}</label>
                <select name="id" defaultValue={current}>
                  <option value="">Nie wysyłaj</option>
                  {list.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "0 0 auto" }}>
                <button className="btn small">Ustaw</button>
              </div>
            </form>
          );
        })}
        <p className="small muted">
          Potwierdzenie wychodzi od razu po rezerwacji, przypomnienie i podziękowanie codziennie wieczorem.
        </p>
      </section>

      <section className="card">
        <h2>Szablony</h2>
        <p className="small muted" style={{ marginTop: -6 }}>
          Możesz używać pól: {Object.entries(PLACEHOLDERS).map(([k, v], i) => (
            <span key={k}>
              {i > 0 && ", "}
              <code>{k}</code> ({v})
            </span>
          ))}
          . Polskie znaki zamieniamy na zwykłe litery, żeby SMS był tańszy (160 znaków na 1 SMS).
        </p>
        {(Object.keys(SMS_KINDS) as SmsKind[]).map((k) => {
          const list = templates.filter((t) => t.kind === k);
          return list.length ? (
            <div key={k}>
              <h2 style={{ marginTop: 20 }}>{SMS_KINDS[k]}</h2>
              {list.map((t) => (
                <Template key={t.id} t={t} />
              ))}
            </div>
          ) : null;
        })}
      </section>

      <section className="card">
        <h2>Nowy szablon</h2>
        <form method="post" action="/api/admin/templates">
          <input type="hidden" name="action" value="add" />
          <div className="row">
            <div>
              <label htmlFor="name">Nazwa</label>
              <input id="name" name="name" type="text" required maxLength={80} />
            </div>
            <div>
              <label htmlFor="kind">Rodzaj</label>
              <KindSelect name="kind" value="other" />
            </div>
          </div>
          <label htmlFor="body">Treść</label>
          <textarea id="body" name="body" required maxLength={640} placeholder="Optyk Wapienna: ..." />
          <button className="btn" style={{ marginTop: 12 }}>
            Dodaj szablon
          </button>
        </form>
      </section>
    </>
  );
}
