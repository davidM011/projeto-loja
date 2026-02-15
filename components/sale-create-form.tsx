"use client";

import { useEffect, useMemo, useState } from "react";

type ClientOption = {
  id: string;
  name: string;
};

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

type ItemRow = {
  id: string;
  productId: string;
  quantity: string;
  unitPrice: string;
};

function createRow(seed: number): ItemRow {
  return {
    id: `row-${seed}`,
    productId: "",
    quantity: "1",
    unitPrice: "",
  };
}

export function SaleCreateForm({
  clients,
  products,
  returnTo = "/operacao",
}: {
  clients: ClientOption[];
  products: ProductOption[];
  returnTo?: string;
}) {
  const [rows, setRows] = useState<ItemRow[]>([createRow(1)]);
  const [registerPaymentNow, setRegisterPaymentNow] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CARTAO" | "MES_SEGUINTE">("PIX");
  const [paymentAmount, setPaymentAmount] = useState("");

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p.price])), [products]);

  function addRow() {
    setRows((prev) => [...prev, createRow(prev.length + 1)]);
  }

  function removeRow(id: string) {
    setRows((prev) => (prev.length === 1 ? prev : prev.filter((row) => row.id !== id)));
  }

  function updateRow(id: string, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  const previewTotal = rows.reduce((acc, row) => {
    const q = Number(row.quantity);
    const p = Number(row.unitPrice);
    if (!Number.isFinite(q) || !Number.isFinite(p) || q <= 0 || p <= 0) return acc;
    return acc + q * p;
  }, 0);

  useEffect(() => {
    if (registerPaymentNow) {
      setPaymentAmount(previewTotal > 0 ? previewTotal.toFixed(2) : "");
    }
  }, [previewTotal, registerPaymentNow]);

  return (
    <form action="/api/sales" method="post" className="grid" style={{ gap: "0.8rem" }}>
      <input type="hidden" name="returnTo" value={returnTo} />

      <div className="form-grid">
        <label className="field">
          Cliente*
          <select name="clientId" required>
            <option value="">Selecione</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Data*
          <input name="saleDate" type="date" required />
        </label>
      </div>

      <div className="grid" style={{ gap: "0.6rem" }}>
        {rows.map((row) => (
          <div key={row.id} className="item-row">
            <label className="field">
              Produto*
              <select
                name="productId"
                value={row.productId}
                required
                onChange={(e) => {
                  const productId = e.target.value;
                  const defaultPrice = productMap.get(productId);
                  updateRow(row.id, {
                    productId,
                    unitPrice: defaultPrice ? String(defaultPrice) : row.unitPrice,
                  });
                }}
              >
                <option value="">Selecione</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              Quantidade*
              <input
                name="quantity"
                type="number"
                min="1"
                step="1"
                value={row.quantity}
                required
                onChange={(e) => updateRow(row.id, { quantity: e.target.value })}
              />
            </label>

            <label className="field">
              Preco unitario*
              <input
                name="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={row.unitPrice}
                required
                onChange={(e) => updateRow(row.id, { unitPrice: e.target.value })}
              />
            </label>

            <button className="btn btn-secondary" type="button" onClick={() => removeRow(row.id)}>
              Remover
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn btn-secondary" type="button" onClick={addRow}>
          Adicionar item
        </button>
        <strong>Total prev.: R$ {previewTotal.toFixed(2)}</strong>
      </div>

      <article className="card glass" style={{ padding: "0.8rem" }}>
        <label className="field-inline" style={{ marginBottom: "0.5rem" }}>
          <span>Registrar pagamento agora</span>
          <input
            name="registerPaymentNow"
            type="checkbox"
            checked={registerPaymentNow}
            onChange={(e) => setRegisterPaymentNow(e.target.checked)}
          />
        </label>

        {registerPaymentNow && (
          <div className="form-grid">
            <label className="field">
              Metodo*
              <select name="paymentMethod" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as "PIX" | "CARTAO" | "MES_SEGUINTE")}>
                <option value="PIX">PIX</option>
                <option value="CARTAO">CARTAO</option>
                <option value="MES_SEGUINTE">MES_SEGUINTE</option>
              </select>
            </label>

            <label className="field">
              Valor do pagamento*
              <input name="paymentAmount" type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required />
            </label>

            {paymentMethod === "MES_SEGUINTE" && (
              <label className="field">
                Vencimento
                <input name="paymentDueDate" type="date" />
              </label>
            )}

            {paymentMethod === "CARTAO" && (
              <>
                <label className="field">
                  Parcelas
                  <input name="cardInstallments" type="number" min="1" step="1" />
                </label>
                <label className="field">
                  Bandeira
                  <input name="cardBrand" />
                </label>
              </>
            )}
          </div>
        )}
      </article>

      <button className="btn" type="submit">
        Criar venda
      </button>
    </form>
  );
}
