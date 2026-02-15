import { getClientsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClientsData();

  return (
    <section className="grid">
      <h1>Clientes</h1>

      <article className="card">
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

      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>WhatsApp</th>
            <th>Historico</th>
            <th>Divida atual</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>{c.whatsapp}</td>
              <td>{c.orders} compras</td>
              <td>R$ {c.debt.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
