import { getProductsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await getProductsData();

  return (
    <section className="grid">
      <h1>Produtos</h1>

      <article className="card">
        <h2>Novo produto</h2>
        <form action="/api/products" method="post" className="form-grid">
          <label className="field">
            Nome*
            <input name="name" required />
          </label>
          <label className="field">
            Preco de venda*
            <input name="salePrice" type="number" min="0" step="0.01" required />
          </label>
          <label className="field">
            Estoque
            <input name="stock" type="number" min="0" step="1" />
          </label>
          <label className="field">
            Custo
            <input name="cost" type="number" min="0" step="0.01" />
          </label>
          <button className="btn" type="submit">
            Salvar produto
          </button>
        </form>
      </article>

      <table className="table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Preco venda</th>
            <th>Estoque</th>
            <th>Custo</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>R$ {p.price.toFixed(2)}</td>
              <td>{p.stock ?? "-"}</td>
              <td>{p.cost ? `R$ ${p.cost.toFixed(2)}` : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
