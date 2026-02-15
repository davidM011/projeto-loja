import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const form = await req.formData();
  const returnTo = String(form.get("returnTo") ?? "").trim();
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/operacao";
  const redirectUrl = new URL(safeReturn, req.url);
  const name = String(form.get("name") ?? "").trim();
  const sku = String(form.get("sku") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();
  const salePrice = Number(form.get("salePrice") ?? 0);
  const stockText = String(form.get("stock") ?? "").trim();
  const minStockText = String(form.get("minStock") ?? "").trim();
  const costText = String(form.get("cost") ?? "").trim();

  if (!name || !Number.isFinite(salePrice) || salePrice <= 0) {
    redirectUrl.searchParams.set("productCreate", "erro");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const stock = stockText ? Number(stockText) : null;
  const minStock = minStockText ? Number(minStockText) : 0;
  const cost = costText ? Number(costText) : null;

  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();
    await supabase.from("products").insert({
      name,
      sku: sku || null,
      category: category || null,
      sale_price: salePrice,
      stock: Number.isFinite(stock as number) ? stock : null,
      min_stock: Number.isFinite(minStock) ? minStock : 0,
      cost_price: Number.isFinite(cost as number) ? cost : null,
    });
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  redirectUrl.searchParams.set("productCreate", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
