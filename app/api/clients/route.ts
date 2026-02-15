import { NextResponse } from "next/server";
import { getSupabaseServerClient, requireAuthenticatedUser } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const form = await req.formData();
  const returnTo = String(form.get("returnTo") ?? "").trim();
  const safeReturn = returnTo.startsWith("/") ? returnTo : "/operacao";
  const redirectUrl = new URL(safeReturn, req.url);
  const name = String(form.get("name") ?? "").trim();
  const whatsapp = String(form.get("whatsapp") ?? "").trim();
  const notes = String(form.get("notes") ?? "").trim();
  const isActive = String(form.get("isActive") ?? "true") !== "false";

  if (!name || !whatsapp) {
    return NextResponse.redirect(redirectUrl, { status: 303 });
  }

  try {
    await requireAuthenticatedUser();
    const supabase = getSupabaseServerClient();
    await supabase.from("clients").insert({
      name,
      whatsapp,
      notes: notes || null,
      is_active: isActive,
    });
  } catch {
    return NextResponse.redirect(new URL("/login", req.url), { status: 303 });
  }

  return NextResponse.redirect(redirectUrl, { status: 303 });
}
