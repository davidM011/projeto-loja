import { getDashboardData, getReceivablesData, getSalesData } from "@/lib/data";

export const dynamic = "force-dynamic";

function bars(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100));
}

export default async function ReportsPage() {
  const [dashboard, sales, fiado] = await Promise.all([
    getDashboardData(),
    getSalesData(),
    getReceivablesData({ status: "TODOS", method: "MES_SEGUINTE", period: "TODOS" }),
  ]);

  const byStatus = {
    pendente: fiado.filter((r) => r.status === "PENDENTE").length,
    atrasado: fiado.filter((r) => r.status === "ATRASADO").length,
    confirmado: fiado.filter((r) => r.status === "CONFIRMADO").length,
  };

  const recent = sales.slice(0, 8).reverse();
  const recentBars = bars(recent.map((s) => s.total));
  const fiadoTotal = fiado.reduce((acc, row) => acc + row.amount, 0);
  const fiadoOpen = fiado.filter((r) => r.status !== "CONFIRMADO").reduce((acc, row) => acc + row.amount, 0);

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Relatorios</h1>
        <p>Metricas consolidadas, graficos e exportacao CSV para Excel.</p>
      </div>

      <div className="grid grid-4">
        <article className="card glass compact-card">
          <h3>Vendido no mes</h3>
          <strong>R$ {dashboard.soldMonth.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Fiado total</h3>
          <strong>R$ {fiadoTotal.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Fiado em aberto</h3>
          <strong>R$ {fiadoOpen.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Estoque baixo</h3>
          <strong>{dashboard.lowStockCount}</strong>
        </article>
      </div>

      <div className="grid grid-3">
        <article className="card glass">
          <h2>Status do fiado</h2>
          <p>Pendente: {byStatus.pendente}</p>
          <p>Atrasado: {byStatus.atrasado}</p>
          <p>Confirmado: {byStatus.confirmado}</p>
        </article>

        <article className="card glass">
          <h2>Exportacoes</h2>
          <div className="grid" style={{ gap: "0.5rem" }}>
            <a className="btn" href="/api/reports/sales" target="_blank" rel="noreferrer">
              Exportar vendas (CSV)
            </a>
            <a className="btn btn-secondary" href="/api/reports/payments" target="_blank" rel="noreferrer">
              Exportar pagamentos (CSV)
            </a>
          </div>
        </article>

        <article className="card glass">
          <h2>Resumo rapido</h2>
          <p>Proximos vencimentos: {dashboard.nextDue.length}</p>
          <p>Vencimento dia 10: {dashboard.nextDay10Count}</p>
        </article>
      </div>

      <article className="card glass">
        <h2>Grafico de vendas recentes</h2>
        <div className="grid" style={{ gap: "0.55rem" }}>
          {recent.length === 0 ? (
            <p className="muted">Sem vendas registradas ainda.</p>
          ) : (
            recent.map((sale, idx) => (
              <div key={sale.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem", fontSize: "0.85rem" }}>
                  <span>{sale.date}</span>
                  <span>R$ {sale.total.toFixed(2)}</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: `${recentBars[idx]}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
