import Link from "next/link";
import { getDashboardData, getReceivablesData, getSalesData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [dashboard, receivables, sales] = await Promise.all([
    getDashboardData(),
    getReceivablesData({ status: "TODOS", method: "MES_SEGUINTE", period: "TODOS" }),
    getSalesData(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const dueToday = receivables.filter((p) => p.dueDate === today && p.status !== "CONFIRMADO");
  const overdue = receivables.filter((p) => p.status === "ATRASADO");
  const recentSales = sales.slice(0, 8);

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Dashboard</h1>
        <p>Visao geral da loja com foco em caixa, fiado e operacao.</p>
      </div>

      <div className="grid grid-4">
        <article className="card kpi-card glass">
          <span>Vendido no mes</span>
          <strong>R$ {dashboard.soldMonth.toFixed(2)}</strong>
        </article>
        <article className="card kpi-card glass">
          <span>Fiado em aberto</span>
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

      {(overdue.length > 0 || dueToday.length > 0) && (
        <div className="alert-strip">
          <strong>Avisos do dia</strong>
          <span>{overdue.length} fiados atrasados</span>
          <span>{dueToday.length} fiados vencendo hoje</span>
        </div>
      )}

      <div className="grid grid-3">
        <article className="card glass">
          <h2>Acoes rapidas</h2>
          <div className="grid" style={{ gap: "0.55rem" }}>
            <Link href="/operacao" className="btn">
              Nova venda
            </Link>
            <Link href="/fiado" className="btn btn-secondary">
              Registrar fiado
            </Link>
            <Link href="/relatorios" className="btn btn-secondary">
              Exportar relatorios
            </Link>
          </div>
        </article>

        <article className="card glass">
          <h2>Vencimento dia 10</h2>
          <p className="muted">Contas do mes seguinte com data padrao.</p>
          <strong>{dashboard.nextDay10Count} titulos</strong>
        </article>

        <article className="card glass">
          <h2>Performance recente</h2>
          <p>Ultimas vendas registradas: {recentSales.length}</p>
          <p>Proximos vencimentos: {dashboard.nextDue.length}</p>
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
            {dashboard.nextDue.length === 0 ? (
              <tr>
                <td colSpan={6}>Nenhum vencimento nos proximos 7 dias.</td>
              </tr>
            ) : (
              dashboard.nextDue.map((item) => (
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
              ))
            )}
          </tbody>
        </table>
      </article>
    </section>
  );
}
