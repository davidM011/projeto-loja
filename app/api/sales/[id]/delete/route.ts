import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

type Params = { params: { id: string } };

type SaleItemRow = {
  product_id: string;
  qty: number;
};

type ProductStockRow = {
  id: string;
  stock: number | null;
};

function getErrorCode(message: string | undefined) {
  if (!message) return "erro";
  const text = message.toLowerCase();
  if (text.includes("foreign key") || text.includes("violates")) return "vinculado";
  return "erro";
}

export async function POST(req: Request, { params }: Params) {
  const form = await req.formData();
  const returnTo = String(form.get("returnTo") ?? "").trim();
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/operacao";
  const redirectUrl = new URL(safeReturn, req.url);
  const saleId = String(params.id ?? "").trim();

  if (!saleId) {
    redirectUrl.searchParams.set("saleDelete", "erro");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();

    const itemsResult = await supabase.from("sale_items").select("product_id, qty").eq("sale_id", saleId);
    if (itemsResult.error) {
      redirectUrl.searchParams.set("saleDelete", "erro");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const items = (itemsResult.data ?? []) as SaleItemRow[];
    const qtyByProduct = new Map<string, number>();
    for (const item of items) {
      const productId = String(item.product_id);
      qtyByProduct.set(productId, (qtyByProduct.get(productId) ?? 0) + Number(item.qty ?? 0));
    }

    const productIds = Array.from(qtyByProduct.keys());
    if (productIds.length > 0) {
      const productsResult = await supabase.from("products").select("id, stock").in("id", productIds);
      if (!productsResult.error) {
        for (const product of (productsResult.data ?? []) as ProductStockRow[]) {
          const id = String(product.id);
          const returnedQty = qtyByProduct.get(id) ?? 0;
          if (returnedQty <= 0 || product.stock == null) continue;
          await supabase.from("products").update({ stock: Number(product.stock) + returnedQty }).eq("id", id);
        }
      }
    }

    const deleteResult = await supabase.from("sales").delete().eq("id", saleId);
    if (deleteResult.error) {
      redirectUrl.searchParams.set("saleDelete", getErrorCode(deleteResult.error.message));
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  redirectUrl.searchParams.set("saleDelete", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
