import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dashboard = await getDashboardData();

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Dashboard</h1>
        <p>Visao geral financeira e operacional da loja.</p>
      </div>

      <div className="grid grid-4">
        <article className="card kpi-card glass">
          <span>Vendido no mes</span>
          <strong>R$ {dashboard.soldMonth.toFixed(2)}</strong>
        </article>
        <article className="card kpi-card glass">
          <span>Total a receber</span>
          <strong>R$ {dashboard.openAmount.toFixed(2)}</strong>
        </article>
        <article className="card kpi-card glass">
          <span>Total atrasado</span>
          <strong>R$ {dashboard.overdueAmount.toFixed(2)}</strong>
        </article>
        <article className="card kpi-card glass">
          <span>Estoque baixo</span>
          <strong>{dashboard.lowStockCount}</strong>
        </article>
      </div>

      <article className="card glass">
        <h2>Proximos vencimentos (7 dias)</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Venda</th>
              <th>Metodo</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.nextDue.map((item) => (
              <tr key={item.id}>
                <td>{item.client}</td>
                <td>{item.saleCode}</td>
                <td>{item.method}</td>
                <td>{item.dueDate}</td>
                <td>R$ {item.amount.toFixed(2)}</td>
                <td>
                  <span className={item.status === "ATRASADO" ? "badge badge-danger" : "badge"}>{item.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
