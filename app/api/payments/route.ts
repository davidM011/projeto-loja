import { NextResponse } from "next/server";
import { getAutomaticDueDate, normalizePaymentOnCreate } from "@/lib/payment-rules";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";
import type { PaymentMethod } from "@/lib/types";

export async function POST(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = await req.json();

    const method = body.method as PaymentMethod;
    const saleDate = new Date(body.saleDate);

    const normalized = normalizePaymentOnCreate({
      method,
      amount: Number(body.amount),
      saleDate,
      cardInstallments: body.cardInstallments,
      cardBrand: body.cardBrand,
    });

    return NextResponse.json({
      ok: true,
      payment: normalized,
      previewDueDate: method === "MES_SEGUINTE" ? getAutomaticDueDate(saleDate).toISOString().slice(0, 10) : null,
    });
  }

  const form = await req.formData();
  const saleId = String(form.get("saleId") ?? "").trim();
  const method = String(form.get("method") ?? "").trim() as PaymentMethod;
  const amount = Number(form.get("amount") ?? 0);
  const installmentsText = String(form.get("cardInstallments") ?? "").trim();
  const cardBrand = String(form.get("cardBrand") ?? "").trim();

  const validMethod = method === "PIX" || method === "DINHEIRO" || method === "CARTAO" || method === "TRANSFERENCIA" || method === "MES_SEGUINTE";
  if (!saleId || !validMethod || amount <= 0) {
    return NextResponse.redirect(new URL("/contas-receber", req.url), { status: 303 });
  }

  const installments = installmentsText ? Number(installmentsText) : null;

  try {
    const user = await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();
    await supabase.from("payments").insert({
      sale_id: saleId,
      method,
      amount,
      card_installments: method === "CARTAO" && Number.isFinite(installments as number) ? installments : null,
      card_brand: method === "CARTAO" ? cardBrand || null : null,
      status: method === "MES_SEGUINTE" ? "PENDENTE" : "CONFIRMADO",
      created_by: user.id,
    });
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  return NextResponse.redirect(new URL("/contas-receber", req.url), { status: 303 });
}
