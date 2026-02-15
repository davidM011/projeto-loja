"use client";

import { useMemo, useState } from "react";

type ClientOption = {
  id: string;
  name: string;
  whatsapp?: string;
};

type ProductOption = {
  id: string;
  name: string;
  price: number;
};

export function FiadoForm({
  clients,
  products,
  action,
}: {
  clients: ClientOption[];
  products: ProductOption[];
  action: string;
}) {
  const [clientId, setClientId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const selectedClient = clientMap.get(clientId);
  const selectedProduct = productMap.get(productId);
  const unitPrice = selectedProduct?.price ?? 0;
  const qty = Number(quantity);
  const total = Number.isFinite(qty) && qty > 0 ? qty * unitPrice : 0;

  return (
    <form action={action} method="post" className="form-grid">
      <label className="field">
        Cliente*
        <select name="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} required>
          <option value="">Selecione</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Celular
        <input value={selectedClient?.whatsapp ?? ""} readOnly placeholder="WhatsApp do cliente" />
      </label>

      <label className="field">
        Produto*
        <select name="productId" value={productId} onChange={(e) => setProductId(e.target.value)} required>
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
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
      </label>

      <label className="field">
        Valor unitario
        <input name="unitPrice" value={unitPrice ? unitPrice.toFixed(2) : ""} readOnly />
      </label>

      <label className="field">
        Valor total
        <input value={total ? total.toFixed(2) : ""} readOnly />
      </label>

      <label className="field">
        Data da venda*
        <input name="saleDate" type="date" required />
      </label>

      <label className="field">
        Data de pagamento*
        <input name="paymentDate" type="date" required />
      </label>

      <button className="btn" type="submit">
        Registrar fiado
      </button>
    </form>
  );
}
