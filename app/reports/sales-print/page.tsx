import { getSalesData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function SalesPrintPage() {
  const sales = await getSalesData();

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Relatorio de Vendas</h1>
      <p>Use Ctrl+P e escolha "Salvar como PDF".</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>ID</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Cliente</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Data</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Total</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Status</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Responsavel</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td style={{ padding: "6px 0" }}>{sale.code}</td>
              <td style={{ padding: "6px 0" }}>{sale.client}</td>
              <td style={{ padding: "6px 0" }}>{sale.date}</td>
              <td style={{ padding: "6px 0" }}>R$ {sale.total.toFixed(2)}</td>
              <td style={{ padding: "6px 0" }}>{sale.status}</td>
              <td style={{ padding: "6px 0" }}>{sale.responsible || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
