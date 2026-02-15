import Link from "next/link";
import { getClientDetailData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const detail = await getClientDetailData(params.id);

  if (!detail) {
    return (
      <section className="grid page-gap">
        <Link href="/clientes" className="btn btn-secondary" style={{ width: "fit-content" }}>
          Voltar
        </Link>
        <article className="card glass">
          <h1>Cliente nao encontrado</h1>
        </article>
      </section>
    );
  }

  return (
    <section className="grid page-gap">
      <div className="section-head">
        <Link href="/clientes" className="btn btn-secondary" style={{ width: "fit-content" }}>
          Voltar
        </Link>
        <h1>{detail.name}</h1>
        <p>{detail.whatsapp}</p>
      </div>

      <div className="grid grid-4">
        <article className="card kpi-card glass">
          <span>Em aberto</span>
          <strong>R$ {detail.totalOpen.toFixed(2)}</strong>
        </article>
        <article className="card kpi-card glass">
          <span>Atrasados</span>
          <strong>{detail.overdueCount}</strong>
        </article>
        <article className="card kpi-card glass">
          <span>Total compras</span>
          <strong>{detail.totalPurchases}</strong>
        </article>
        <article className="card kpi-card glass">
          <span>Total pago</span>
          <strong>R$ {detail.totalPaid.toFixed(2)}</strong>
        </article>
      </div>

      <article className="card glass">
        <h2>Fiado / contas do cliente</h2>
        <table className="table glass">
          <thead>
            <tr>
              <th>Venda</th>
              <th>Metodo</th>
              <th>Vencimento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Acao</th>
            </tr>
          </thead>
          <tbody>
            {detail.openPayments.length === 0 ? (
              <tr>
                <td colSpan={6}>Sem pagamentos para exibir.</td>
              </tr>
            ) : (
              detail.openPayments.map((item) => (
                <tr key={item.id}>
                  <td>{item.saleCode}</td>
                  <td>{item.method}</td>
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
                        <input type="hidden" name="returnTo" value={`/clientes/${detail.id}`} />
                        <button className="btn btn-small" type="submit">
                          Receber agora
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>

      <article className="card glass">
        <h2>Historico de vendas</h2>
        <table className="table glass">
          <thead>
            <tr>
              <th>Venda</th>
              <th>Data</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {detail.recentSales.map((sale) => (
              <tr key={sale.id}>
                <td>{sale.code}</td>
                <td>{sale.date}</td>
                <td>R$ {sale.total.toFixed(2)}</td>
                <td>{sale.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </section>
  );
}
