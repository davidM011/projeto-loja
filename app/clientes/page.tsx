import Link from "next/link";
import { getClientsData } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = {
  clientDelete?: string | string[];
};

function pick(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ClientsPage({ searchParams }: { searchParams?: SearchParams }) {
  const clients = await getClientsData();
  const clientDelete = pick(searchParams?.clientDelete);

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Clientes</h1>
        <p>Cadastre clientes e acompanhe historico e fiado em um clique.</p>
      </div>

      {clientDelete === "ok" && (
        <div className="alert-strip">
          <strong>Cliente removido</strong>
          <span>Registro excluido com sucesso.</span>
        </div>
      )}
      {clientDelete === "vinculado" && (
        <div className="alert-strip">
          <strong>Nao foi possivel remover</strong>
          <span>Esse cliente possui vendas vinculadas.</span>
        </div>
      )}
      {clientDelete === "erro" && (
        <div className="alert-strip">
          <strong>Erro ao remover</strong>
          <span>Tente novamente em alguns segundos.</span>
        </div>
      )}

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
              <td style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                <Link className="btn btn-secondary btn-small" href={`/clientes/${c.id}`}>
                  Abrir 360
                </Link>
                <form action={`/api/clients/${c.id}/delete`} method="post">
                  <button className="btn btn-secondary btn-small" type="submit">
                    Remover
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
