import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const form = await req.formData();

  const clientId = String(form.get("clientId") ?? "").trim();
  const saleDate = String(form.get("saleDate") ?? "").trim();
  const paymentDate = String(form.get("paymentDate") ?? "").trim();
  const productId = String(form.get("productId") ?? "").trim();
  const quantity = Number(form.get("quantity") ?? 0);
  const unitPrice = Number(form.get("unitPrice") ?? 0);

  if (!clientId || !saleDate || !paymentDate || !productId || quantity <= 0 || unitPrice <= 0) {
    return NextResponse.redirect(new URL("/operacao", req.url), { status: 303 });
  }

  const lineTotal = Number((quantity * unitPrice).toFixed(2));

  try {
    const user = await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();

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
      return NextResponse.redirect(new URL("/operacao", req.url), { status: 303 });
    }

    await supabase.from("sale_items").insert({
      sale_id: saleResult.data.id,
      product_id: productId,
      qty: quantity,
      unit_price: unitPrice,
      line_total: lineTotal,
    });

    await supabase.from("payments").insert({
      sale_id: saleResult.data.id,
      method: "MES_SEGUINTE",
      amount: lineTotal,
      status: "PENDENTE",
      due_date: paymentDate,
      created_by: user.id,
    });
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  return NextResponse.redirect(new URL("/operacao", req.url), { status: 303 });
}
