import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

function csvEscape(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export async function GET() {
  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();

    const [salesResult, clientsResult] = await Promise.all([
      supabase.from("sales").select("id, client_id, sale_date, total, status").order("sale_date", { ascending: false }).limit(500),
      supabase.from("clients").select("id, name"),
    ]);

    if (salesResult.error || clientsResult.error) {
      return new NextResponse("Erro ao gerar relatorio de vendas", { status: 500 });
    }

    const clientName = new Map<string, string>();
    for (const c of clientsResult.data ?? []) {
      clientName.set(String(c.id), String(c.name));
    }

    const lines = ["sale_id,cliente,data,total,status"];
    for (const row of salesResult.data ?? []) {
      lines.push([
        csvEscape(String(row.id)),
        csvEscape(clientName.get(String(row.client_id)) ?? "-"),
        csvEscape(String(row.sale_date ?? "")),
        String(row.total ?? 0),
        csvEscape(String(row.status ?? "")),
      ].join(","));
    }

    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=relatorio-vendas.csv",
      },
    });
  } catch {
    return new NextResponse("Nao autorizado", { status: 401 });
  }
}
