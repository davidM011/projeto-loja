import { getDashboardData, getReceivablesData, getSalesData } from "@/lib/data";

export const dynamic = "force-dynamic";

function bars(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100));
}

export default async function ReportsPage() {
  const [dashboard, sales, receivables] = await Promise.all([
    getDashboardData(),
    getSalesData(),
    getReceivablesData({ status: "TODOS", period: "TODOS" }),
  ]);

  const byStatus = {
    pendente: receivables.filter((r) => r.status === "PENDENTE").length,
    atrasado: receivables.filter((r) => r.status === "ATRASADO").length,
    confirmado: receivables.filter((r) => r.status === "CONFIRMADO").length,
  };

  const byMethod = {
    pix: receivables.filter((r) => r.method === "PIX").reduce((a, b) => a + b.amount, 0),
    cartao: receivables.filter((r) => r.method === "CARTAO").reduce((a, b) => a + b.amount, 0),
    fiado: receivables.filter((r) => r.method === "MES_SEGUINTE").reduce((a, b) => a + b.amount, 0),
  };

  const recent = sales.slice(0, 6).reverse();
  const recentBars = bars(recent.map((s) => s.total));

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Relatorios</h1>
        <p>Metricas, graficos e exportacoes em formatos populares (CSV).</p>
      </div>

      <div className="grid grid-4">
        <article className="card glass compact-card">
          <h3>Vendido no mes</h3>
          <strong>R$ {dashboard.soldMonth.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>A receber</h3>
          <strong>R$ {dashboard.openAmount.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Atrasado</h3>
          <strong>R$ {dashboard.overdueAmount.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Estoque baixo</h3>
          <strong>{dashboard.lowStockCount}</strong>
        </article>
      </div>

      <div className="grid grid-3">
        <article className="card glass">
          <h2>Status dos pagamentos</h2>
          <p>Pendente: {byStatus.pendente}</p>
          <p>Atrasado: {byStatus.atrasado}</p>
          <p>Confirmado: {byStatus.confirmado}</p>
        </article>

        <article className="card glass">
          <h2>Volume por metodo</h2>
          <p>PIX: R$ {byMethod.pix.toFixed(2)}</p>
          <p>Cartao: R$ {byMethod.cartao.toFixed(2)}</p>
          <p>Fiado: R$ {byMethod.fiado.toFixed(2)}</p>
        </article>

        <article className="card glass">
          <h2>Exportar relatorios</h2>
          <div className="grid" style={{ gap: "0.5rem" }}>
            <a className="btn" href="/api/reports/sales" target="_blank" rel="noreferrer">
              Exportar vendas (CSV)
            </a>
            <a className="btn btn-secondary" href="/api/reports/payments" target="_blank" rel="noreferrer">
              Exportar pagamentos (CSV)
            </a>
          </div>
        </article>
      </div>

      <article className="card glass">
        <h2>Grafico rapido de vendas recentes</h2>
        <div className="grid" style={{ gap: "0.55rem" }}>
          {recent.map((sale, idx) => (
            <div key={sale.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem", fontSize: "0.85rem" }}>
                <span>{sale.date}</span>
                <span>R$ {sale.total.toFixed(2)}</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${recentBars[idx]}%` }} />
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
