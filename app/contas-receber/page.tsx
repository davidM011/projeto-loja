import { FiadoForm } from "@/components/fiado-form";
import { getClientOptions, getProductOptions, getReceivablesData } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string | string[];
  method?: string | string[];
  clientId?: string | string[];
  period?: string | string[];
};

function pick(value: string | string[] | undefined, fallback = "TODOS") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function ReceivablesPage({ searchParams }: { searchParams?: SearchParams }) {
  const status = pick(searchParams?.status);
  const method = pick(searchParams?.method);
  const clientId = pick(searchParams?.clientId);
  const period = pick(searchParams?.period);

  const [allReceivables, clients, products] = await Promise.all([
    getReceivablesData({ status, method, clientId, period: period as "TODOS" | "HOJE" | "PROX_7" | "ATRASADAS" }),
    getClientOptions(),
    getProductOptions(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const in7Date = new Date();
  in7Date.setDate(in7Date.getDate() + 7);
  const in7 = in7Date.toISOString().slice(0, 10);

  const dueToday = allReceivables.filter((i) => i.dueDate === today);
  const next7 = allReceivables.filter((i) => (i.dueDate ? i.dueDate > today && i.dueDate <= in7 : false));
  const overdue = allReceivables.filter((i) => i.status === "ATRASADO");

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Contas a receber</h1>
        <p>Central unico do fiado: registro, alerta e recebimento.</p>
      </div>

      <article className="card glass">
        <h2>Novo fichamento no fiado</h2>
        <FiadoForm action="/api/fiado" clients={clients} products={products} />
      </article>

      {(overdue.length > 0 || next7.length > 0) && (
        <div className="alert-strip">
          <strong>Avisos</strong>
          <span>{overdue.length} contas atrasadas</span>
          <span>{next7.length} contas perto de vencer</span>
          <span>{dueToday.length} vencem hoje</span>
        </div>
      )}

      <article className="card glass">
        <form action="/contas-receber" method="get" className="filter-grid">
          <label className="field-inline">
            Status
            <select name="status" defaultValue={status}>
              <option value="TODOS">TODOS</option>
              <option value="PENDENTE">PENDENTE</option>
              <option value="ATRASADO">ATRASADO</option>
              <option value="CONFIRMADO">CONFIRMADO</option>
            </select>
          </label>

          <label className="field-inline">
            Metodo
            <select name="method" defaultValue={method}>
              <option value="TODOS">TODOS</option>
              <option value="MES_SEGUINTE">MES_SEGUINTE</option>
              <option value="PIX">PIX</option>
              <option value="CARTAO">CARTAO</option>
            </select>
          </label>

          <label className="field-inline">
            Cliente
            <select name="clientId" defaultValue={clientId}>
              <option value="TODOS">TODOS</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-inline">
            Periodo
            <select name="period" defaultValue={period}>
              <option value="TODOS">TODOS</option>
              <option value="HOJE">HOJE</option>
              <option value="PROX_7">PROXIMOS 7 DIAS</option>
              <option value="ATRASADAS">ATRASADAS</option>
            </select>
          </label>

          <button className="btn" type="submit">
            Aplicar filtros
          </button>
        </form>
      </article>

      <div className="grid grid-3">
        <article className="card glass compact-card">
          <h3>Vence hoje</h3>
          <strong>{dueToday.length}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Proximos 7 dias</h3>
          <strong>{next7.length}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Atrasadas</h3>
          <strong>{overdue.length}</strong>
        </article>
      </div>

      <table className="table glass">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Venda</th>
            <th>Vencimento</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Acao</th>
          </tr>
        </thead>
        <tbody>
          {allReceivables.length === 0 ? (
            <tr>
              <td colSpan={6}>Nenhum registro encontrado com os filtros atuais.</td>
            </tr>
          ) : (
            allReceivables.map((item) => (
              <tr key={item.id}>
                <td>{item.client}</td>
                <td>{item.saleCode}</td>
                <td>{item.dueDate ?? "-"}</td>
                <td>R$ {item.amount.toFixed(2)}</td>
                <td>
                  <span
                    className={
                      item.status === "ATRASADO"
                        ? "badge badge-danger"
                        : item.status === "CONFIRMADO"
                          ? "badge badge-ok"
                          : "badge"
                    }
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.status === "CONFIRMADO" ? (
                    "-"
                  ) : (
                    <form action={`/api/payments/${item.id}/confirm`} method="post">
                      <button className="btn btn-small" type="submit">
                        Receber agora
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
