import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const form = await req.formData();
  const returnTo = String(form.get("returnTo") ?? "").trim();
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/operacao";
  const redirectUrl = new URL(safeReturn, req.url);
  const name = String(form.get("name") ?? "").trim();
  const salePrice = Number(form.get("salePrice") ?? 0);
  const stockText = String(form.get("stock") ?? "").trim();
  const costText = String(form.get("cost") ?? "").trim();

  if (!name || !Number.isFinite(salePrice) || salePrice <= 0) {
    redirectUrl.searchParams.set("productCreate", "erro");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  const stock = stockText ? Number(stockText) : null;
  const cost = costText ? Number(costText) : null;

  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();
    await supabase.from("products").insert({
      name,
      sale_price: salePrice,
      stock: Number.isFinite(stock as number) ? stock : null,
      cost_price: Number.isFinite(cost as number) ? cost : null,
    });
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  redirectUrl.searchParams.set("productCreate", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
