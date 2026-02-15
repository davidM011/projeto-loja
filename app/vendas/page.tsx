import { getClientOptions, getProductOptions, getSalesData } from "@/lib/data";
import { SaleCreateForm } from "@/components/sale-create-form";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const [sales, clients, products] = await Promise.all([getSalesData(), getClientOptions(), getProductOptions()]);

  return (
    <section className="grid">
      <h1>Vendas</h1>

      <article className="card">
        <h2>Nova venda (multiplos itens)</h2>
        <SaleCreateForm clients={clients} products={products} />
      </article>

      <table className="table">
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Cliente</th>
            <th>Data</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td>{sale.code}</td>
              <td>{sale.client}</td>
              <td>{sale.date}</td>
              <td>R$ {sale.total.toFixed(2)}</td>
              <td>
                <span className={sale.status === "ATRASADA" ? "badge badge-danger" : "badge"}>{sale.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
