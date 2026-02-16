import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

type Params = { params: { id: string } };

function getErrorCode(message: string | undefined) {
  if (!message) return "erro";
  const text = message.toLowerCase();
  if (text.includes("foreign key") || text.includes("violates")) return "vinculado";
  return "erro";
}

export async function POST(req: Request, { params }: Params) {
  const form = await req.formData();
  const returnTo = String(form.get("returnTo") ?? "").trim();
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/clientes";
  const redirectUrl = new URL(safeReturn, req.url);
  const clientId = String(params.id ?? "").trim();

  if (!clientId) {
    redirectUrl.searchParams.set("clientDelete", "erro");
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();
    const result = await supabase.from("clients").delete().eq("id", clientId);

    if (result.error) {
      redirectUrl.searchParams.set("clientDelete", getErrorCode(result.error.message));
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  redirectUrl.searchParams.set("clientDelete", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
