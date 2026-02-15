import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();

    const [paymentsResult, salesResult, clientsResult] = await Promise.all([
      supabase
        .from("payments")
        .select("id, sale_id, method, due_date, amount, status")
        .order("created_at", { ascending: false })
        .limit(800),
      supabase.from("sales").select("id, client_id"),
      supabase.from("clients").select("id, name"),
    ]);

    if (paymentsResult.error || salesResult.error || clientsResult.error) {
      return new NextResponse("Erro ao gerar relatorio de pagamentos", { status: 500 });
    }

    const saleToClient = new Map<string, string>();
    for (const sale of salesResult.data ?? []) {
      saleToClient.set(String(sale.id), String(sale.client_id));
    }

    const clientName = new Map<string, string>();
    for (const c of clientsResult.data ?? []) {
      clientName.set(String(c.id), String(c.name));
    }

    const lines = ["payment_id,sale_id,cliente,metodo,vencimento,valor,status"];
    for (const row of paymentsResult.data ?? []) {
      const saleId = String(row.sale_id ?? "");
      const cId = saleToClient.get(saleId) ?? "";
      lines.push([
        csvEscape(String(row.id)),
        csvEscape(saleId),
        csvEscape(clientName.get(cId) ?? "-"),
        csvEscape(String(row.method ?? "")),
        csvEscape(String(row.due_date ?? "")),
        String(row.amount ?? 0),
        csvEscape(String(row.status ?? "")),
      ].join(","));
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=relatorio-pagamentos.csv",
      },
    });
  } catch {
    return new NextResponse("Nao autorizado", { status: 401 });
  }
}
