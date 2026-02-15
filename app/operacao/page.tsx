import Link from "next/link";
import { SaleCreateForm } from "@/components/sale-create-form";
import { getClientOptions, getFiadoStats, getProductsData, getSalesData } from "@/lib/data";

export const dynamic = "force-dynamic";

type SearchParams = {
  sale?: string | string[];
  productDelete?: string | string[];
  productCreate?: string | string[];
};

function pick(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function OperacaoPage({ searchParams }: { searchParams?: SearchParams }) {
  const [products, sales, fiadoStats, clients] = await Promise.all([
    getProductsData(),
    getSalesData(),
    getFiadoStats(),
    getClientOptions(),
  ]);

  const lowStock = products.filter((p) => p.stock != null && p.stock <= 5);
  const saleFeedback = pick(searchParams?.sale);
  const productDelete = pick(searchParams?.productDelete);
  const productCreate = pick(searchParams?.productCreate);

  const overdueFiado = fiadoStats.overdueCount;
  const openFiado = fiadoStats.openCount;

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Operacao</h1>
        <p>Cadastro de produto, estoque e venda em um unico fluxo.</p>
      </div>

      <div className="grid grid-4">
        <article className="card glass compact-card">
          <h3>Produtos cadastrados</h3>
          <strong>{products.length}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Estoque baixo</h3>
          <strong>{lowStock.length}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Vendas registradas</h3>
          <strong>{sales.length}</strong>
        </article>
        <article className="card glass compact-card">
          <h3>Fiado em aberto</h3>
          <strong>{openFiado}</strong>
        </article>
      </div>

      <article className="card glass">
        <h2>Cadastro de produto e estoque</h2>
        {productDelete === "ok" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Produto removido</strong>
            <span>Registro excluido com sucesso.</span>
          </div>
        )}
        {productCreate === "ok" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Produto salvo</strong>
            <span>Cadastro concluido com sucesso.</span>
          </div>
        )}
        {productDelete === "vinculado" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Nao foi possivel remover</strong>
            <span>Esse produto possui vendas vinculadas.</span>
          </div>
        )}
        {productDelete === "erro" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Erro ao remover</strong>
            <span>Tente novamente em alguns segundos.</span>
          </div>
        )}

        <form action="/api/products" method="post" className="form-grid">
          <input type="hidden" name="returnTo" value="/operacao" />
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

        <div style={{ marginTop: "0.9rem" }}>
          <table className="table glass">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preco</th>
                <th>Estoque</th>
                <th>Alerta</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 12).map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>R$ {p.price.toFixed(2)}</td>
                  <td>{p.stock ?? "-"}</td>
                  <td>{p.stock != null && p.stock <= 5 ? <span className="badge badge-danger">Baixo</span> : <span className="badge">OK</span>}</td>
                  <td>
                    <form action={`/api/products/${p.id}/delete`} method="post">
                      <input type="hidden" name="returnTo" value="/operacao" />
                      <button className="btn btn-secondary btn-small" type="submit">
                        Remover
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card glass">
        <h2>Cadastro de venda</h2>
        {saleFeedback === "ok" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Venda criada</strong>
            <span>Venda registrada com sucesso.</span>
          </div>
        )}
        {saleFeedback === "erro" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Falha ao criar venda</strong>
            <span>Confira os dados dos itens e pagamento.</span>
          </div>
        )}
        {saleFeedback === "estoque" && (
          <div className="alert-strip" style={{ marginBottom: "0.9rem" }}>
            <strong>Estoque insuficiente</strong>
            <span>Um ou mais produtos nao possuem saldo para esta venda.</span>
          </div>
        )}

        <SaleCreateForm clients={clients} products={products.map((p) => ({ id: p.id, name: p.name, price: p.price }))} returnTo="/operacao" />

        <div style={{ marginTop: "0.9rem" }}>
          <table className="table glass">
            <thead>
              <tr>
                <th>Venda</th>
                <th>Cliente</th>
                <th>Data</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 10).map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.code}</td>
                  <td>{sale.client}</td>
                  <td>{sale.date}</td>
                  <td>R$ {sale.total.toFixed(2)}</td>
                  <td>{sale.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card glass">
        <h2>Atalho para fiado</h2>
        <p className="muted">Toda gestao de fiado (registro, alertas e recebimento) agora fica em uma tela exclusiva.</p>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link href="/fiado" className="btn">
            Abrir central de fiado
          </Link>
          <span className="badge">{overdueFiado} atrasadas</span>
          <span className="badge">{openFiado} em aberto</span>
        </div>
      </article>
    </section>
  );
}
