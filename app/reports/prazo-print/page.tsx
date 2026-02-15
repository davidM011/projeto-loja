import { getReceivablesData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PrazoPrintPage() {
  const rows = await getReceivablesData({ method: "MES_SEGUINTE", status: "TODOS", period: "TODOS" });

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Relatorio de Pagamentos a Prazo</h1>
      <p>Use Ctrl+P e escolha "Salvar como PDF".</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Cliente</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Venda</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Vencimento</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Valor</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: "6px 0" }}>{item.client}</td>
              <td style={{ padding: "6px 0" }}>{item.saleCode}</td>
              <td style={{ padding: "6px 0" }}>{item.dueDate ?? "-"}</td>
              <td style={{ padding: "6px 0" }}>R$ {item.amount.toFixed(2)}</td>
              <td style={{ padding: "6px 0" }}>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
