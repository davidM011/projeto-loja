import { SaleCreateForm } from "@/components/sale-create-form";
import { getClientOptions, getClientsData, getProductOptions, getReceivablesData, getSalesData } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = {
  sale?: string | string[];
  saleDelete?: string | string[];
  clientDelete?: string | string[];
  status?: string | string[];
  method?: string | string[];
  clientId?: string | string[];
  period?: string | string[];
};

function pick(value: string | string[] | undefined, fallback = "TODOS") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export default async function OperacaoPage({ searchParams }: { searchParams?: SearchParams }) {
  const saleFeedback = pick(searchParams?.sale, "");
  const saleDelete = pick(searchParams?.saleDelete, "");
  const clientDelete = pick(searchParams?.clientDelete, "");
  const status = pick(searchParams?.status, "TODOS");
  const method = pick(searchParams?.method, "TODOS");
  const clientId = pick(searchParams?.clientId, "TODOS");
  const period = pick(searchParams?.period, "TODOS");

  const [sales, clients, clientOptions, productOptions, receivables] = await Promise.all([
    getSalesData(),
    getClientsData(),
    getClientOptions(),
    getProductOptions(),
    getReceivablesData({ status, method, clientId, period: period as "TODOS" | "HOJE" | "PROX_7" | "ATRASADAS" }),
  ]);

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Operacao</h1>
        <p>Vendas, clientes e pagamentos em uma unica aba.</p>
      </div>

      <article className="card glass">
        <h2>Cadastro de clientes</h2>
        {clientDelete === "ok" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Cliente removido</strong>
            <span>Registro excluido com sucesso.</span>
          </div>
        )}
        {clientDelete === "vinculado" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Nao foi possivel remover</strong>
            <span>Esse cliente possui vendas vinculadas.</span>
          </div>
        )}
        {clientDelete === "erro" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Erro ao remover cliente</strong>
            <span>Tente novamente em alguns segundos.</span>
          </div>
        )}

        <form action="/api/clients" method="post" className="form-grid">
          <input type="hidden" name="returnTo" value="/operacao" />
          <label className="field">
            Nome*
            <input name="name" required />
          </label>
          <label className="field">
            Telefone/contato*
            <input name="whatsapp" required />
          </label>
          <label className="field">
            Status
            <select name="isActive" defaultValue="true">
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </label>
          <label className="field" style={{ gridColumn: "1 / -1" }}>
            Observacoes
            <textarea name="notes" rows={2} />
          </label>
          <button className="btn" type="submit">
            Salvar cliente
          </button>
        </form>

        <div style={{ marginTop: "0.8rem" }}>
          <table className="table glass">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Contato</th>
                <th>Compras</th>
                <th>Divida</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              {clients.slice(0, 8).map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.whatsapp}</td>
                  <td>{c.orders}</td>
                  <td>R$ {c.debt.toFixed(2)}</td>
                  <td>
                    <form action={`/api/clients/${c.id}/delete`} method="post">
                      <input type="hidden" name="returnTo" value="/operacao" />
                      <button className="btn btn-secondary btn-small" type="submit">
                        Remover
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card glass">
        <h2>Registro de vendas</h2>
        {saleFeedback === "ok" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Venda registrada</strong>
            <span>Cadastro concluido com sucesso.</span>
          </div>
        )}
        {saleFeedback === "estoque" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Estoque insuficiente</strong>
            <span>Venda bloqueada para evitar estoque negativo.</span>
          </div>
        )}
        {saleFeedback === "erro" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Falha ao salvar venda</strong>
            <span>Revise os campos e tente novamente.</span>
          </div>
        )}
        {saleDelete === "ok" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Compra removida</strong>
            <span>Venda excluida e estoque devolvido.</span>
          </div>
        )}
        {saleDelete === "erro" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Erro ao remover compra</strong>
            <span>Tente novamente em alguns segundos.</span>
          </div>
        )}

        <SaleCreateForm clients={clientOptions} products={productOptions} returnTo="/operacao" />

        <div style={{ marginTop: "0.8rem" }}>
          <table className="table glass">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Total</th>
                <th>Status</th>
                <th>Responsavel</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 12).map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.code}</td>
                  <td>{sale.client}</td>
                  <td>{sale.date}</td>
                  <td>R$ {sale.total.toFixed(2)}</td>
                  <td>{sale.status}</td>
                  <td>{sale.responsible || "-"}</td>
                  <td>
                    <form action={`/api/sales/${sale.id}/delete`} method="post">
                      <input type="hidden" name="returnTo" value="/operacao" />
                      <button className="btn btn-secondary btn-small" type="submit">
                        Remover
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card glass">
        <h2>Pagamentos (incluindo fiado)</h2>
        <form action="/operacao" method="get" className="filter-grid">
          <label className="field-inline">
            Status
            <select name="status" defaultValue={status}>
              <option value="TODOS">TODOS</option>
              <option value="PENDENTE">PENDENTE</option>
              <option value="ATRASADO">ATRASADO</option>
              <option value="CONFIRMADO">PAGO</option>
            </select>
          </label>

          <label className="field-inline">
            Forma
            <select name="method" defaultValue={method}>
              <option value="TODOS">TODOS</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="CARTAO">CARTAO</option>
              <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              <option value="MES_SEGUINTE">FIADO (PAGAMENTO A PRAZO)</option>
            </select>
          </label>

          <label className="field-inline">
            Cliente
            <select name="clientId" defaultValue={clientId}>
              <option value="TODOS">TODOS</option>
              {clientOptions.map((c) => (
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
            Filtrar
          </button>
        </form>

        <div style={{ marginTop: "0.8rem" }}>
          <table className="table glass">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Venda</th>
                <th>Metodo</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              {receivables.length === 0 ? (
                <tr>
                  <td colSpan={7}>Nenhum pagamento encontrado.</td>
                </tr>
              ) : (
                receivables.slice(0, 25).map((item) => (
                  <tr key={item.id}>
                    <td>{item.client}</td>
                    <td>{item.saleCode}</td>
                    <td>{item.method === "MES_SEGUINTE" ? "FIADO" : item.method}</td>
                    <td>{item.dueDate ?? "-"}</td>
                    <td>R$ {item.amount.toFixed(2)}</td>
                    <td>{item.status}</td>
                    <td>
                      {item.status === "CONFIRMADO" ? (
                        "-"
                      ) : (
                        <form action={`/api/payments/${item.id}/confirm`} method="post">
                          <input type="hidden" name="returnTo" value="/operacao" />
                          <button className="btn btn-small" type="submit">
                            Marcar pago
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
