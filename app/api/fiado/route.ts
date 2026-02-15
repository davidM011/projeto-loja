import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

type ProductRow = {
  id: string;
  sale_price: number;
  stock: number | null;
};

export async function POST(req: Request) {
  const form = await req.formData();
  const returnTo = String(form.get("returnTo") ?? "").trim();
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/fiado";
  const redirectUrl = new URL(safeReturn, req.url);

  const clientId = String(form.get("clientId") ?? "").trim();
  const saleDate = String(form.get("saleDate") ?? "").trim();
  const paymentDate = String(form.get("paymentDate") ?? "").trim();
  const productId = String(form.get("productId") ?? "").trim();
  const quantity = Number(form.get("quantity") ?? 0);

  if (!clientId || !saleDate || !paymentDate || !productId || quantity <= 0) {
    redirectUrl.searchParams.set("fiado", "erro");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  try {
    const user = await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();

    const productResult = await supabase.from("products").select("id, sale_price, stock").eq("id", productId).maybeSingle();
    if (productResult.error || !productResult.data) {
      redirectUrl.searchParams.set("fiado", "erro");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const product = productResult.data as ProductRow;
    const unitPrice = Number(product.sale_price);
    const stock = product.stock == null ? null : Number(product.stock);

    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      redirectUrl.searchParams.set("fiado", "erro");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    if (stock != null && stock < quantity) {
      redirectUrl.searchParams.set("fiado", "estoque");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const lineTotal = Number((quantity * unitPrice).toFixed(2));

    const saleResult = await supabase
      .from("sales")
      .insert({
        client_id: clientId,
        sale_date: saleDate,
        total: lineTotal,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (saleResult.error || !saleResult.data?.id) {
      redirectUrl.searchParams.set("fiado", "erro");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const saleId = saleResult.data.id;

    const saleItemsResult = await supabase.from("sale_items").insert({
      sale_id: saleId,
      product_id: productId,
      qty: quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    });

    if (saleItemsResult.error) {
      await supabase.from("sales").delete().eq("id", saleId);
      redirectUrl.searchParams.set("fiado", "erro");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    const paymentResult = await supabase.from("payments").insert({
      sale_id: saleId,
      method: "MES_SEGUINTE",
      amount: lineTotal,
      status: "PENDENTE",
      due_date: paymentDate,
      created_by: user.id,
    });

    if (paymentResult.error) {
      await supabase.from("sales").delete().eq("id", saleId);
      redirectUrl.searchParams.set("fiado", "erro");
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }

    if (stock != null) {
      const newStock = Math.max(0, stock - quantity);
      await supabase.from("products").update({ stock: newStock }).eq("id", productId);
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  redirectUrl.searchParams.set("fiado", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
