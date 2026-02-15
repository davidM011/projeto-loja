import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const form = await req.formData();
  const returnTo = String(form.get("returnTo") ?? "").trim();
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/operacao";
  const redirectUrl = new URL(safeReturn, req.url);
  const paymentId = params.id;

  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();
    await supabase
      .from("payments")
      .update({
        paid_at: new Date().toISOString(),
      })
      .eq("id", paymentId);
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  redirectUrl.searchParams.set("receive", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
