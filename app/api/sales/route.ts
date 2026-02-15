import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
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

export async function POST(req: Request) {
  const form = await req.formData();

  const clientId = String(form.get("clientId") ?? "").trim();
  const saleDate = String(form.get("saleDate") ?? "").trim();
  const items = buildItems(form);

  if (!clientId || !saleDate || items.length === 0) {
    return NextResponse.redirect(new URL("/vendas", req.url), { status: 303 });
  }

  const total = Number(items.reduce((acc, item) => acc + item.lineTotal, 0).toFixed(2));

  try {
    const user = await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();

    const saleResult = await supabase
      .from("sales")
      .insert({ client_id: clientId, sale_date: saleDate, total, created_by: user.id })
      .select("id")
      .single();

    if (saleResult.error || !saleResult.data?.id) {
      return NextResponse.redirect(new URL("/vendas", req.url), { status: 303 });
    }

    const rows = items.map((item) => ({
      sale_id: saleResult.data.id,
      product_id: item.productId,
      qty: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
    }));

    await supabase.from("sale_items").insert(rows);
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  return NextResponse.redirect(new URL("/vendas", req.url), { status: 303 });
}
