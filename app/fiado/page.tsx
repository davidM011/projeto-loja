import { FiadoForm } from "@/components/fiado-form";
import { getClientOptions, getProductOptions, getReceivablesData } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string | string[];
  clientId?: string | string[];
  period?: string | string[];
  fiado?: string | string[];
  receive?: string | string[];
};

function pick(value: string | string[] | undefined, fallback = "TODOS") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function FiadoPage({ searchParams }: { searchParams?: SearchParams }) {
  const status = pick(searchParams?.status);
  const clientId = pick(searchParams?.clientId);
  const period = pick(searchParams?.period);
  const fiadoFeedback = pick(searchParams?.fiado, "");
  const receiveFeedback = pick(searchParams?.receive, "");

  const [allReceivables, clients, products] = await Promise.all([
    getReceivablesData({ status, method: "MES_SEGUINTE", clientId, period: period as "TODOS" | "HOJE" | "PROX_7" | "ATRASADAS" }),
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
        <h1>Fiado</h1>
        <p>Registro, alerta e recebimento das vendas a prazo.</p>
      </div>

      <article className="card glass">
        <h2>Novo fichamento no fiado</h2>
        {fiadoFeedback === "ok" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Fiado registrado</strong>
            <span>O lancamento foi salvo e entrou nas contas a receber.</span>
          </div>
        )}
        {fiadoFeedback === "erro" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Falha ao registrar</strong>
            <span>Confira os dados antes de salvar.</span>
          </div>
        )}
        {fiadoFeedback === "estoque" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Estoque insuficiente</strong>
            <span>Nao foi possivel registrar esse fiado.</span>
          </div>
        )}
        {receiveFeedback === "ok" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Pagamento confirmado</strong>
            <span>Conta marcada como recebida.</span>
          </div>
        )}
        <FiadoForm action="/api/fiado" clients={clients} products={products} returnTo="/fiado" />
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
        <form action="/fiado" method="get" className="filter-grid">
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
              <td colSpan={6}>Nenhum fiado encontrado com os filtros atuais.</td>
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
                      <input type="hidden" name="returnTo" value="/fiado" />
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
