import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

  return NextResponse.redirect(new URL("/contas-receber", req.url), { status: 303 });
}
