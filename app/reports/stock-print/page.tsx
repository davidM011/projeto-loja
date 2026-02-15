import { getProductsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StockPrintPage() {
  const products = await getProductsData();
  const lowStockCount = products.filter((p) => p.stock != null && p.stock <= (p.minStock ?? 0)).length;
  const issuedAt = new Date().toLocaleString("pt-BR");

  return (
    <main className="report-page">
      <style>{`
        .report-page { max-width: 1024px; margin: 0 auto; padding: 24px; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; }
        .report-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; }
        .report-meta { color:#6b7280; font-size: 12px; margin-bottom: 12px; }
        .report-kpis { display:grid; grid-template-columns: repeat(2, minmax(120px, 1fr)); gap:10px; margin-bottom:14px; }
        .kpi { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background:#f9fafb; }
        .kpi strong { display:block; font-size: 18px; margin-top: 4px; }
        table { width:100%; border-collapse: collapse; background:#fff; }
        th, td { border-bottom:1px solid #e5e7eb; text-align:left; padding:8px; font-size: 13px; }
        th { font-size:11px; color:#6b7280; text-transform:uppercase; letter-spacing:.04em; }
        .row-low { background: #fff7ed; }
        .tools { margin-top: 12px; }
        .btn { border:1px solid #d1d5db; background:#fff; border-radius:8px; padding:8px 10px; cursor:pointer; }
        @media print { .report-page { background:#fff; padding:0; } .tools { display:none; } .report-card { border:none; padding:0; } }
      `}</style>

      <article className="report-card">
        <h1>Relatorio de Estoque</h1>
        <p className="report-meta">Gerado em: {issuedAt}</p>

        <section className="report-kpis">
          <div className="kpi">
            <span>Total de produtos</span>
            <strong>{products.length}</strong>
          </div>
          <div className="kpi">
            <span>Abaixo do minimo</span>
            <strong>{lowStockCount}</strong>
          </div>
        </section>

        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th>Categoria</th>
              <th>SKU</th>
              <th>Estoque</th>
              <th>Minimo</th>
              <th>Preco venda</th>
            </tr>
          </thead>
          <tbody>
            {products.map((item) => {
              const low = item.stock != null && item.stock <= (item.minStock ?? 0);
              return (
                <tr key={item.id} className={low ? "row-low" : ""}>
                  <td>{item.name}</td>
                  <td>{item.category || "-"}</td>
                  <td>{item.sku || "-"}</td>
                  <td>{item.stock ?? "-"}</td>
                  <td>{item.minStock ?? 0}</td>
                  <td>R$ {item.price.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="tools">
          <button className="btn" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
        </div>
      </article>
    </main>
  );
}
