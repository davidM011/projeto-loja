import { getProductsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StockPrintPage() {
  const products = await getProductsData();

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      <h1>Relatorio de Estoque</h1>
      <p>Use Ctrl+P e escolha "Salvar como PDF".</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Produto</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Categoria</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>SKU</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Estoque</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Minimo</th>
            <th style={{ borderBottom: "1px solid #ddd", textAlign: "left" }}>Preco venda</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => (
            <tr key={item.id}>
              <td style={{ padding: "6px 0" }}>{item.name}</td>
              <td style={{ padding: "6px 0" }}>{item.category || "-"}</td>
              <td style={{ padding: "6px 0" }}>{item.sku || "-"}</td>
              <td style={{ padding: "6px 0" }}>{item.stock ?? "-"}</td>
              <td style={{ padding: "6px 0" }}>{item.minStock ?? 0}</td>
              <td style={{ padding: "6px 0" }}>R$ {item.price.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
