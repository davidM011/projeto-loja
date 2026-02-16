import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";
import type { PaymentMethod } from "@/lib/types";

type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type ProductStockRow = {
  id: string;
  stock: number | null;
};

function buildItems(form: FormData): SaleItemInput[] {
  const productIds = form.getAll("productId").map((v) => String(v ?? "").trim());
  const quantities = form.getAll("quantity").map((v) => Number(v));
  const unitPrices = form.getAll("unitPrice").map((v) => Number(v));

  const maxLength = Math.max(productIds.length, quantities.length, unitPrices.length);
  const items: SaleItemInput[] = [];

  for (let i = 0; i < maxLength; i += 1) {
    const productId = productIds[i] ?? "";
    const quantity = quantities[i] ?? 0;
    const unitPrice = unitPrices[i] ?? 0;

    if (!productId) continue;
    if (!Number.isFinite(quantity) || quantity <= 0) continue;
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) continue;

    const lineTotal = Number((quantity * unitPrice).toFixed(2));
    items.push({ productId, quantity, unitPrice, lineTotal });
  }

  return items;
}

function getReturnTo(form: FormData): string {
  const returnTo = String(form.get("returnTo") ?? "").trim();
  return returnTo.startsWith("/") ? returnTo : "/operacao";
}

function methodIsValid(method: string): method is PaymentMethod {
  return method === "PIX" || method === "DINHEIRO" || method === "CARTAO" || method === "TRANSFERENCIA" || method === "MES_SEGUINTE";
}

export async function POST(req: Request) {
  const form = await req.formData();
  const redirectPath = getReturnTo(form);
  const redirectUrl = new URL(redirectPath, req.url);

  const clientId = String(form.get("clientId") ?? "").trim();
  const saleDate = String(form.get("saleDate") ?? "").trim();
  const items = buildItems(form);

  const registerPaymentNow = String(form.get("registerPaymentNow") ?? "") === "on";
  const paymentMethod = String(form.get("paymentMethod") ?? "").trim();
  const paymentAmount = Number(form.get("paymentAmount") ?? 0);
  const paymentDueDate = String(form.get("paymentDueDate") ?? "").trim();
  const cardInstallments = Number(form.get("cardInstallments") ?? 0);
  const cardBrand = String(form.get("cardBrand") ?? "").trim();

  if (!clientId || !saleDate || items.length === 0) {
    redirectUrl.searchParams.set("sale", "campos");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  if (registerPaymentNow) {
    if (!methodIsValid(paymentMethod) || !Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      redirectUrl.searchParams.set("sale", "pagamento");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
    if (paymentMethod === "MES_SEGUINTE" && !paymentDueDate) {
      redirectUrl.searchParams.set("sale", "vencimento");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
  }

  const total = Number(items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2));

  try {
    const user = await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();

    let responsibleName = (user.email ?? "Usuario").split("@")[0];
    const profileResult = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    if (!profileResult.error) {
      const profileName = String(profileResult.data?.full_name ?? "").trim();
      if (profileName) responsibleName = profileName;
    }

    const uniqueProductIds = Array.from(new Set(items.map((item) => item.productId)));
    const stockResult = await supabase.from("products").select("id, stock").in("id", uniqueProductIds);
    if (stockResult.error) {
      redirectUrl.searchParams.set("sale", "produtos");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const stockMap = new Map<string, number | null>();
    for (const row of (stockResult.data ?? []) as ProductStockRow[]) {
      stockMap.set(String(row.id), row.stock == null ? null : Number(row.stock));
    }

    const qtyByProduct = new Map<string, number>();
    for (const item of items) {
      qtyByProduct.set(item.productId, (qtyByProduct.get(item.productId) ?? 0) + item.quantity);
    }

    for (const [productId, qty] of qtyByProduct.entries()) {
      const currentStock = stockMap.get(productId);
      if (currentStock == null) continue;
      if (currentStock < qty) {
        redirectUrl.searchParams.set("sale", "estoque");
        return NextResponse.redirect(redirectUrl, { status: 303 });
      }
    }

    const saleResult = await supabase
      .from("sales")
      .insert({ client_id: clientId, sale_date: saleDate, total, responsible: responsibleName, created_by: user.id })
      .select("id")
      .single();

    if (saleResult.error || !saleResult.data?.id) {
      const message = String(saleResult.error?.message ?? "").toLowerCase();
      if (message.includes("foreign key") || message.includes("client_id")) {
        redirectUrl.searchParams.set("sale", "cliente");
      } else {
        redirectUrl.searchParams.set("sale", "erro");
      }
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const saleId = saleResult.data.id;
    const rows = items.map((item) => ({
      sale_id: saleId,
      product_id: item.productId,
      qty: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    }));

    const saleItemsResult = await supabase.from("sale_items").insert(rows);
    if (saleItemsResult.error) {
      await supabase.from("sales").delete().eq("id", saleId);
      redirectUrl.searchParams.set("sale", "itens");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    if (registerPaymentNow && methodIsValid(paymentMethod)) {
      const paymentInsert = await supabase.from("payments").insert({
        sale_id: saleId,
        method: paymentMethod,
        amount: paymentAmount,
        status: paymentMethod === "MES_SEGUINTE" ? "PENDENTE" : "CONFIRMADO",
        due_date: paymentMethod === "MES_SEGUINTE" ? (paymentDueDate || null) : null,
        card_installments: paymentMethod === "CARTAO" && cardInstallments > 0 ? cardInstallments : null,
        card_brand: paymentMethod === "CARTAO" ? (cardBrand || null) : null,
        created_by: user.id,
      });

      if (paymentInsert.error) {
        await supabase.from("sales").delete().eq("id", saleId);
        const message = String(paymentInsert.error.message ?? "").toLowerCase();
        if (message.includes("invalid input value for enum") || message.includes("payment_method")) {
          redirectUrl.searchParams.set("sale", "metodo");
        } else {
          redirectUrl.searchParams.set("sale", "pagamento_db");
        }
        return NextResponse.redirect(redirectUrl, { status: 303 });
      }
    }

    for (const [productId, qty] of qtyByProduct.entries()) {
      const currentStock = stockMap.get(productId);
      if (currentStock == null) continue;
      const newStock = Math.max(0, currentStock - qty);
      await supabase.from("products").update({ stock: newStock }).eq("id", productId);
    }
  } catch {
    redirectUrl.searchParams.set("sale", "sessao");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  redirectUrl.searchParams.set("sale", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
