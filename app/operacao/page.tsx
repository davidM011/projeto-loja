import Link from "next/link";
import { SaleCreateForm } from "@/components/sale-create-form";
import { FiadoForm } from "@/components/fiado-form";
import { getClientOptions, getProductOptions, getProductsData, getReceivablesData, getSalesData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function OperacaoPage() {
  const [products, sales, receivables, clients, productOptions] = await Promise.all([
    getProductsData(),
    getSalesData(),
    getReceivablesData({ status: "TODOS", period: "TODOS" }),
    getClientOptions(),
    getProductOptions(),
  ]);

  const lowStock = products.filter((p) => p.stock != null && p.stock <= 5);

  const today = new Date().toISOString().slice(0, 10);
  const nearLimitDate = new Date();
  nearLimitDate.setDate(nearLimitDate.getDate() + 3);
  const nearLimit = nearLimitDate.toISOString().slice(0, 10);
  const overdueCount = receivables.filter((r) => r.status === "ATRASADO").length;
  const nearDueCount = receivables.filter((r) => (r.status === "PENDENTE" && r.dueDate ? r.dueDate >= today && r.dueDate <= nearLimit : false)).length;

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <h1>Operacao</h1>
        <p>Cadastros e rotina diaria em uma unica tela.</p>
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
          <strong>{receivables.filter((r) => r.status !== "CONFIRMADO").length}</strong>
        </article>
      </div>

      <article className="card glass">
        <h2>Cadastro de produto e estoque</h2>
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

        <div style={{ marginTop: "0.9rem" }}>
          <table className="table glass">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Preco</th>
                <th>Estoque</th>
                <th>Alerta</th>
              </tr>
            </thead>
            <tbody>
              {products.slice(0, 12).map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>R$ {p.price.toFixed(2)}</td>
                  <td>{p.stock ?? "-"}</td>
                  <td>{p.stock != null && p.stock <= 5 ? <span className="badge badge-danger">Baixo</span> : <span className="badge">OK</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="card glass">
        <h2>Cadastro de venda</h2>
        <SaleCreateForm clients={clients} products={productOptions} />

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
        <h2>Fichamento no fiado</h2>
        <p className="muted">Cliente + celular + produto (valor automatico) + data da venda + data de pagamento.</p>
        <FiadoForm action="/api/fiado" clients={clients} products={productOptions} />

        {(overdueCount > 0 || nearDueCount > 0) && (
          <div className="alert-strip" style={{ marginTop: "0.9rem" }}>
            <strong>Avisos</strong>
            <span>{overdueCount} atrasadas</span>
            <span>{nearDueCount} perto de vencer (3 dias)</span>
          </div>
        )}

        <div style={{ marginTop: "0.9rem" }}>
          <table className="table glass">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Venda</th>
                <th>Vencimento</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Acao</th>
              </tr>
            </thead>
            <tbody>
              {receivables.slice(0, 12).map((item) => (
                <tr key={item.id}>
                  <td>{item.client}</td>
                  <td>{item.saleCode}</td>
                  <td>{item.dueDate ?? "-"}</td>
                  <td>R$ {item.amount.toFixed(2)}</td>
                  <td>
                    <span
                      className={
                        item.status === "ATRASADO"
                          ? "badge badge-danger"
                          : item.status === "CONFIRMADO"
                            ? "badge badge-ok"
                            : "badge"
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                  <td>
                    {item.status === "CONFIRMADO" ? (
                      "-"
                    ) : (
                      <form action={`/api/payments/${item.id}/confirm`} method="post">
                        <button className="btn btn-small" type="submit">
                          Receber
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "0.8rem" }}>
            <Link href="/contas-receber" className="btn btn-secondary">
              Abrir central completa de contas a receber
            </Link>
          </div>
        </div>
      </article>
    </section>
  );
}
