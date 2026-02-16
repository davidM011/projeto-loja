import { getDashboardData, getProductsData, getReceivablesData, getSalesData } from "@/lib/data";
import { getSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

function bars(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.round((v / max) * 100));
}

function isDateInLastDays(dateIso: string, days: number) {
  if (!dateIso) return false;
  const d = new Date(`${dateIso}T00:00:00`);
  const now = new Date();
  const floorNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = floorNow.getTime() - d.getTime();
  return diff >= 0 && diff <= days * 24 * 60 * 60 * 1000;
}

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function buildTrendSeries(sales: Array<{ date: string; total: number }>, days: number) {
  const totals = new Map<string, number>();
  for (const sale of sales) {
    const key = sale.date;
    totals.set(key, (totals.get(key) ?? 0) + sale.total);
  }

  const labels: string[] = [];
  const values: number[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const iso = date.toISOString().slice(0, 10);
    labels.push(iso.slice(5));
    values.push(Number((totals.get(iso) ?? 0).toFixed(2)));
  }

  return { labels, values };
}

function growthPercent(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function linePath(values: number[]) {
  if (values.length === 0) return "";
  const width = 100;
  const height = 40;
  const max = Math.max(...values, 1);
  return values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function areaPath(values: number[]) {
  if (values.length === 0) return "";
  const width = 100;
  const height = 40;
  const max = Math.max(...values, 1);
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - (value / max) * height;
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" L ");
  return `M 0 40 L ${points} L 100 40 Z`;
}

export default async function DashboardsPage() {
  const [dashboard, sales, receivables, products] = await Promise.all([
    getDashboardData(),
    getSalesData(),
    getReceivablesData({ status: "TODOS", period: "TODOS" }),
    getProductsData(),
  ]);

  let topProducts: Array<{ name: string; qty: number }> = [];
  if (hasSupabaseEnv()) {
    const supabase = getSupabaseServerClient();
    const [itemsResult, productsResult] = await Promise.all([
      supabase.from("sale_items").select("product_id, qty").limit(1000),
      supabase.from("products").select("id, name"),
    ]);

    if (!itemsResult.error && !productsResult.error) {
      const nameById = new Map<string, string>();
      for (const p of productsResult.data ?? []) {
        nameById.set(String(p.id), String(p.name));
      }
      const qtyByName = new Map<string, number>();
      for (const row of itemsResult.data ?? []) {
        const name = nameById.get(String(row.product_id)) ?? "Produto";
        qtyByName.set(name, (qtyByName.get(name) ?? 0) + Number(row.qty ?? 0));
      }
      topProducts = Array.from(qtyByName.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);
    }
  }

  const soldToday = sales.filter((s) => isDateInLastDays(s.date, 0)).reduce((a, b) => a + b.total, 0);
  const soldWeek = sales.filter((s) => isDateInLastDays(s.date, 7)).reduce((a, b) => a + b.total, 0);
  const soldMonth = sales.filter((s) => isDateInLastDays(s.date, 30)).reduce((a, b) => a + b.total, 0);
  const ticketAvg = sales.length > 0 ? soldMonth / Math.max(1, sales.filter((s) => isDateInLastDays(s.date, 30)).length) : 0;
  const soldPrevWeek = sales.filter((s) => isDateInLastDays(s.date, 14) && !isDateInLastDays(s.date, 7)).reduce((a, b) => a + b.total, 0);
  const soldGrowth = growthPercent(soldWeek, soldPrevWeek);

  const today = new Date().toISOString().slice(0, 10);
  const next7Date = new Date();
  next7Date.setDate(next7Date.getDate() + 7);
  const next7 = next7Date.toISOString().slice(0, 10);

  const overdue = receivables.filter((r) => r.status === "ATRASADO");
  const dueSoon = receivables.filter((r) => r.status === "PENDENTE" && r.dueDate != null && r.dueDate >= today && r.dueDate <= next7);
  const lowStock = products.filter((p) => p.stock != null && p.stock <= (p.minStock ?? 0));

  const byResponsible = sales.reduce<Record<string, number>>((acc, sale) => {
    const key = sale.responsible || "SEM_RESPONSAVEL";
    acc[key] = (acc[key] ?? 0) + sale.total;
    return acc;
  }, {});

  const trend = buildTrendSeries(sales, 14);
  const trendLine = linePath(trend.values);
  const trendArea = areaPath(trend.values);
  const trendBars = bars(trend.values);
  const topResponsibles = Object.entries(byResponsible).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const attentionLevel = overdue.length > 0 ? "critical" : dueSoon.length > 0 || lowStock.length > 0 ? "warning" : "ok";

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Dashboards</h1>
        <p>Metricas, alertas e relatorios para decisao rapida.</p>
      </div>

      <div className="dashboard-kpi-grid">
        <article className={`card glass kpi-hero ${soldToday === 0 ? "status-warning" : "status-ok"}`}>
          <h3>Total hoje</h3>
          <strong>{formatMoney(soldToday)}</strong>
          <p>{soldToday === 0 ? "Sem vendas hoje" : "Dia em andamento"}</p>
        </article>
        <article className="card glass compact-card kpi-tile">
          <h3>Total semana</h3>
          <strong>{formatMoney(soldWeek)}</strong>
        </article>
        <article className="card glass compact-card kpi-tile">
          <h3>Total mes</h3>
          <strong>{formatMoney(soldMonth)}</strong>
        </article>
        <article className="card glass compact-card kpi-tile">
          <h3>Ticket medio</h3>
          <strong>{formatMoney(ticketAvg)}</strong>
        </article>
      </div>

      <div className="dashboard-health-grid">
        <article className={`card glass health-card ${attentionLevel === "critical" ? "status-critical" : attentionLevel === "warning" ? "status-warning" : "status-ok"}`}>
          <h2>Saude do negocio</h2>
          <p className="health-line"><span>Pagamentos pendentes</span><strong>{formatMoney(dashboard.openAmount)}</strong></p>
          <p className="health-line"><span>Atrasados</span><strong>{overdue.length}</strong></p>
          <p className="health-line"><span>A vencer (7 dias)</span><strong>{dueSoon.length}</strong></p>
          <p className="health-line"><span>Estoque baixo</span><strong>{lowStock.length}</strong></p>
        </article>

        <article className="card glass health-stat status-warning">
          <h3>Atrasados</h3>
          <strong>{overdue.length}</strong>
          <p>contas vencidas</p>
        </article>

        <article className="card glass health-stat status-soft-warning">
          <h3>A vencer</h3>
          <strong>{dueSoon.length}</strong>
          <p>proximos 7 dias</p>
        </article>

        <article className="card glass health-stat status-soft">
          <h3>Estoque baixo</h3>
          <strong>{lowStock.length}</strong>
          <p>produtos abaixo do minimo</p>
        </article>
      </div>

      <div className="dashboard-performance-grid">
        <article className="card glass performance-card">
          <h2>Vendas por responsavel</h2>
          {topResponsibles.length === 0 ? (
            <p className="muted">Sem vendas no periodo.</p>
          ) : (
            topResponsibles.map(([k, v]) => {
              const label = k === "SEM_RESPONSAVEL" ? "Sem responsavel" : k;
              return (
                <p className="performance-line" key={k}>
                  <span>{label}</span>
                  <strong>{formatMoney(v)}</strong>
                </p>
              );
            })
          )}
        </article>

        <article className="card glass performance-card">
          <h2>Top 5 produtos</h2>
          {topProducts.length === 0 ? (
            <p className="muted">Sem dados suficientes.</p>
          ) : (
            topProducts.map((p) => (
              <p className="performance-line" key={p.name}>
                <span>{p.name}</span>
                <strong>{p.qty}</strong>
              </p>
            ))
          )}
        </article>

        <article className="card glass report-card">
          <h2>Relatorios</h2>
          <div className="grid" style={{ gap: "0.45rem" }}>
            <a className="btn" href="/api/reports/sales">Vendas (CSV)</a>
            <a className="btn btn-secondary" href="/api/reports/payments">Pagamentos (CSV)</a>
            <a className="btn btn-secondary" href="/reports/sales-print" target="_blank" rel="noreferrer">Vendas (PDF)</a>
            <a className="btn btn-secondary" href="/reports/prazo-print" target="_blank" rel="noreferrer">Pagamentos a prazo (PDF)</a>
            <a className="btn btn-secondary" href="/reports/stock-print" target="_blank" rel="noreferrer">Estoque (PDF)</a>
          </div>
        </article>
      </div>

      <article className="card glass trend-card">
        <div className="trend-head">
          <div>
            <h2>Tendencia de vendas (14 dias)</h2>
            <p className="muted">Comparativo semanal: {soldGrowth >= 0 ? "+" : ""}{soldGrowth.toFixed(1)}%</p>
          </div>
          <div className={`trend-badge ${soldGrowth >= 0 ? "status-ok" : "status-critical"}`}>
            Semana atual: {formatMoney(soldWeek)}
          </div>
        </div>

        {trend.values.every((v) => v === 0) ? (
          <p className="muted">Sem vendas registradas no periodo.</p>
        ) : (
          <>
            <div className="trend-chart-wrap">
              <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="trend-chart">
                <path d={trendArea} className="trend-area" />
                <path d={trendLine} className="trend-line" />
              </svg>
            </div>
            <div className="trend-bars">
              {trend.values.map((value, idx) => (
                <div className="trend-bar-item" key={`${trend.labels[idx]}-${value}`}>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${trendBars[idx]}%` }} />
                  </div>
                  <div className="trend-caption">
                    <span>{trend.labels[idx]}</span>
                    <strong>{formatMoney(value)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </article>
    </section>
  );
}
