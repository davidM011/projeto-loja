import { getSalesData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SalesPrintPage() {
  const sales = await getSalesData();
  const total = sales.reduce((acc, sale) => acc + sale.total, 0);
  const issuedAt = new Date().toLocaleString("pt-BR");

  return (
    <main className="report-page">
      <style>{`
        .report-page { max-width: 1024px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; }
        .report-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
        .report-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:14px; }
        .report-meta { color:#6b7280; font-size: 12px; }
        .report-kpis { display:grid; grid-template-columns: repeat(3, minmax(120px, 1fr)); gap:10px; margin-bottom:14px; }
        .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background:#f9fafb; }
        .kpi strong { display:block; font-size: 18px; margin-top: 4px; }
        table { width:100%; border-collapse: collapse; background:#fff; }
        th, td { border-bottom:1px solid #e5e7eb; text-align:left; padding:8px; font-size: 13px; }
        th { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; }
        .tools { margin-top: 12px; }
        .btn { border:1px solid #d1d5db; background:#fff; border-radius:8px; padding:8px 10px; cursor:pointer; }
        @media print { .report-page { background:#fff; padding:0; } .tools { display:none; } .report-card { border:none; padding:0; } }
      `}</style>

      <article className="report-card">
        <header className="report-head">
          <div>
            <h1>Relatorio de Vendas</h1>
            <p className="report-meta">Gerado em: {issuedAt}</p>
          </div>
        </header>

        <section className="report-kpis">
          <div className="kpi">
            <span>Total de vendas</span>
            <strong>{sales.length}</strong>
          </div>
          <div className="kpi">
            <span>Valor total</span>
            <strong>R$ {total.toFixed(2)}</strong>
          </div>
          <div className="kpi">
            <span>Ticket medio</span>
            <strong>R$ {(sales.length ? total / sales.length : 0).toFixed(2)}</strong>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Total</th>
              <th>Status</th>
              <th>Responsavel</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.code}</td>
                <td>{sale.client}</td>
                <td>{sale.date}</td>
                <td>R$ {sale.total.toFixed(2)}</td>
                <td>{sale.status}</td>
                <td>{sale.responsible || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tools">
          <button className="btn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
        </div>
      </article>
    </main>
  );
}
