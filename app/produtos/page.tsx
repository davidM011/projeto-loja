import { getProductsData } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = {
  productDelete?: string | string[];
  productCreate?: string | string[];
};

function pick(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function ProductsPage({ searchParams }: { searchParams?: SearchParams }) {
  const products = await getProductsData();
  const productDelete = pick(searchParams?.productDelete);
  const productCreate = pick(searchParams?.productCreate);

  return (
    <section className="grid">
      <h1>Produtos</h1>

      {productDelete === "ok" && (
        <div className="alert-strip">
          <strong>Produto removido</strong>
          <span>Registro excluido com sucesso.</span>
        </div>
      )}
      {productCreate === "ok" && (
        <div className="alert-strip">
          <strong>Produto salvo</strong>
          <span>Cadastro concluido com sucesso.</span>
        </div>
      )}
      {productDelete === "vinculado" && (
        <div className="alert-strip">
          <strong>Nao foi possivel remover</strong>
          <span>Esse produto possui vendas vinculadas.</span>
        </div>
      )}
      {productDelete === "erro" && (
        <div className="alert-strip">
          <strong>Erro ao remover</strong>
          <span>Tente novamente em alguns segundos.</span>
        </div>
      )}

      <article className="card">
        <h2>Novo produto</h2>
        <form action="/api/products" method="post" className="form-grid">
          <input type="hidden" name="returnTo" value="/produtos" />
          <label className="field">
            Nome*
            <input name="name" required />
          </label>
          <label className="field">
            SKU
            <input name="sku" />
          </label>
          <label className="field">
            Categoria
            <input name="category" />
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
            Estoque minimo
            <input name="minStock" type="number" min="0" step="1" defaultValue={0} />
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
            <th>SKU</th>
            <th>Categoria</th>
            <th>Preco venda</th>
            <th>Estoque</th>
            <th>Minimo</th>
            <th>Custo</th>
            <th>Margem</th>
            <th>Acao</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.sku || "-"}</td>
              <td>{p.category || "-"}</td>
              <td>R$ {p.price.toFixed(2)}</td>
              <td>{p.stock ?? "-"}</td>
              <td>{p.minStock ?? 0}</td>
              <td>{p.cost ? `R$ ${p.cost.toFixed(2)}` : "-"}</td>
              <td>{p.cost ? `${(((p.price - p.cost) / p.price) * 100).toFixed(1)}%` : "-"}</td>
              <td>
                <form action={`/api/products/${p.id}/delete`} method="post">
                  <button className="btn btn-secondary btn-small" type="submit">
                    Remover
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
