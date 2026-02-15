import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dashboard = await getDashboardData();

  return (
    <section className="grid" style={{ gap: "1.2rem" }}>
      <h1>Dashboard</h1>

      <div className="grid grid-3">
        <article className="card">
          <div>Vendido no mes</div>
          <div className="kpi">R$ {dashboard.soldMonth.toFixed(2)}</div>
        </article>
        <article className="card">
          <div>Total a receber</div>
          <div className="kpi">R$ {dashboard.openAmount.toFixed(2)}</div>
        </article>
        <article className="card">
          <div>Vence dia 10 (proximo mes)</div>
          <div className="kpi">{dashboard.nextDay10Count}</div>
        </article>
      </div>

      <article className="card">
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
