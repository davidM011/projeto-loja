import { getReceivablesData, getSaleOptions } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = {
  status?: string | string[];
};

export default async function ReceivablesPage({ searchParams }: { searchParams?: SearchParams }) {
  const [receivables, sales] = await Promise.all([getReceivablesData(), getSaleOptions()]);
  const selectedStatusRaw = searchParams?.status;
  const selectedStatus = Array.isArray(selectedStatusRaw) ? selectedStatusRaw[0] ?? "" : selectedStatusRaw ?? "";

  const filtered =
    selectedStatus && selectedStatus !== "TODOS"
      ? receivables.filter((item) => item.status === selectedStatus)
      : receivables;

  return (
    <section className="grid">
      <h1>Contas a receber</h1>

      <article className="card">
        <h2>Adicionar pagamento</h2>
        <form action="/api/payments" method="post" className="form-grid">
          <label className="field">
            Venda*
            <select name="saleId" required>
              <option value="">Selecione</option>
              {sales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.code} - {sale.client} (R$ {sale.total.toFixed(2)})
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            Metodo*
            <select name="method" required>
              <option value="PIX">PIX</option>
              <option value="CARTAO">CARTAO</option>
              <option value="MES_SEGUINTE">MES_SEGUINTE</option>
            </select>
          </label>

          <label className="field">
            Valor*
            <input name="amount" type="number" min="0" step="0.01" required />
          </label>

          <label className="field">
            Parcelas (cartao)
            <input name="cardInstallments" type="number" min="1" step="1" />
          </label>

          <label className="field">
            Bandeira (cartao)
            <input name="cardBrand" />
          </label>

          <button className="btn" type="submit">
            Salvar pagamento
          </button>
        </form>
      </article>

      <article className="card">
        <form action="/contas-receber" method="get" className="form-inline">
          <label className="field-inline">
            Filtro status
            <select name="status" defaultValue={selectedStatus || "TODOS"}>
              <option value="TODOS">TODOS</option>
              <option value="PENDENTE">PENDENTE</option>
              <option value="ATRASADO">ATRASADO</option>
              <option value="CONFIRMADO">CONFIRMADO</option>
            </select>
          </label>
          <button className="btn" type="submit">
            Filtrar
          </button>
        </form>
      </article>

      <table className="table">
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
          {filtered.map((item) => (
            <tr key={item.id}>
              <td>{item.client}</td>
              <td>{item.saleCode}</td>
              <td>{item.method}</td>
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
          ))}
        </tbody>
      </table>
    </section>
  );
}
