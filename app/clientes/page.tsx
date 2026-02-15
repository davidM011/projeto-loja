import Link from "next/link";
import { getClientsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClientsData();

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Clientes</h1>
        <p>Cadastre clientes e acompanhe historico e fiado em um clique.</p>
      </div>

      <article className="card glass">
        <h2>Novo cliente</h2>
        <form action="/api/clients" method="post" className="form-grid">
          <label className="field">
            Nome*
            <input name="name" required />
          </label>
          <label className="field">
            WhatsApp*
            <input name="whatsapp" required />
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Observacao
            <textarea name="notes" rows={3} />
          </label>
          <button className="btn" type="submit">
            Salvar cliente
          </button>
        </form>
      </article>

      <table className="table glass">
        <thead>
          <tr>
            <th>Nome</th>
            <th>WhatsApp</th>
            <th>Compras</th>
            <th>Divida atual</th>
            <th>Acao</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.whatsapp}</td>
              <td>{c.orders}</td>
              <td>R$ {c.debt.toFixed(2)}</td>
              <td>
                <Link className="btn btn-secondary btn-small" href={`/clientes/${c.id}`}>
                  Abrir 360
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
