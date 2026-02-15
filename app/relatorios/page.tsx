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

  const recent = sales.slice(0, 8).reverse();
  const recentBars = bars(recent.map((s) => s.total));

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Dashboards</h1>
        <p>Metricas, alertas e relatorios para decisao rapida.</p>
      </div>

      <div className="grid grid-4">
        <article className="card glass compact-card">
          <h3>Total hoje</h3>
          <strong>R$ {soldToday.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Total semana</h3>
          <strong>R$ {soldWeek.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Total mes</h3>
          <strong>R$ {soldMonth.toFixed(2)}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Ticket medio</h3>
          <strong>R$ {ticketAvg.toFixed(2)}</strong>
        </article>
      </div>

      <div className="grid grid-3">
        <article className="card glass">
          <h2>Pagamentos a prazo e alertas</h2>
          <p>Pendentes/Abertos: R$ {dashboard.openAmount.toFixed(2)}</p>
          <p>Atrasados: {overdue.length}</p>
          <p>A vencer (proximos dias): {dueSoon.length}</p>
          <p>Estoque baixo: {lowStock.length}</p>
        </article>

        <article className="card glass">
          <h2>Vendas por responsavel</h2>
          {Object.keys(byResponsible).length === 0 ? (
            <p className="muted">Sem vendas no periodo.</p>
          ) : (
            Object.entries(byResponsible).map(([k, v]) => <p key={k}>{k}: R$ {v.toFixed(2)}</p>)
          )}
        </article>

        <article className="card glass">
          <h2>Top 5 produtos</h2>
          {topProducts.length === 0 ? (
            <p className="muted">Sem dados suficientes.</p>
          ) : (
            topProducts.map((p) => <p key={p.name}>{p.name}: {p.qty}</p>)
          )}
        </article>

        <article className="card glass">
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

      <article className="card glass">
        <h2>Vendas recentes</h2>
        <div className="grid" style={{ gap: "0.55rem" }}>
          {recent.length === 0 ? (
            <p className="muted">Sem vendas registradas.</p>
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
